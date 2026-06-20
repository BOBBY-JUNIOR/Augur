// ── Bitget data adapter ─────────────────────────────────────────────────────
// Two responsibilities:
//   1. Market candles — live Bitget public REST when reachable, deterministic
//      synthesis otherwise.
//   2. Skill Hub signals — the five skills. `technical-analysis` is always
//      computed from real indicator math on the candles. The other four come
//      from the Skill Hub gateway when BITGET_SKILLHUB_URL is configured, and
//      from a transparent derived heuristic otherwise.
// Every returned signal carries `source: "live" | "simulated"` so provenance is
// never lost downstream.

import crypto from "node:crypto";
import {
  adx,
  atrPct,
  bollingerWidth,
  Candle,
  clamp,
  extendCandles,
  momentum,
} from "./indicators";
import type { AssetId, SkillSignal, TechnicalReadout } from "./types";

const BITGET_REST = "https://api.bitget.com";

function granularityCandles(asset: AssetId, granularity = "1h", limit = 120) {
  return `${BITGET_REST}/api/v2/spot/market/candles?symbol=${asset}&granularity=${granularity}&limit=${limit}`;
}

/** HMAC-SHA256 signer for authenticated Bitget endpoints (sim-trade/account). */
export function signBitget(
  timestamp: string,
  method: string,
  path: string,
  body = ""
): string | null {
  const secret = process.env.BITGET_SECRET_KEY;
  if (!secret) return null;
  const prehash = timestamp + method.toUpperCase() + path + body;
  return crypto.createHmac("sha256", secret).update(prehash).digest("base64");
}

export function bitgetAuthHeaders(
  method: string,
  path: string,
  body = ""
): Record<string, string> | null {
  const key = process.env.BITGET_API_KEY;
  const pass = process.env.BITGET_PASSPHRASE;
  const ts = Date.now().toString();
  const sign = signBitget(ts, method, path, body);
  if (!key || !pass || !sign) return null;
  return {
    "ACCESS-KEY": key,
    "ACCESS-SIGN": sign,
    "ACCESS-TIMESTAMP": ts,
    "ACCESS-PASSPHRASE": pass,
    "Content-Type": "application/json",
    locale: "en-US",
  };
}

/**
 * Fetch live candles; on any failure, continue the prior simulated series so
 * prices stay continuous across cycles (`prev` is the asset's last stored window).
 */
export async function getCandles(
  asset: AssetId,
  seedKey: string,
  prev?: Candle[]
): Promise<{ candles: Candle[]; source: "live" | "simulated" }> {
  try {
    const res = await fetch(granularityCandles(asset), {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { code: string; data: string[][] };
    if (json.code !== "00000" || !Array.isArray(json.data)) {
      throw new Error(`bad payload code=${json.code}`);
    }
    // Bitget rows: [ts, open, high, low, close, baseVol, quoteVol, ...]
    const candles: Candle[] = json.data
      .map((r) => ({
        ts: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[5]),
      }))
      .sort((a, b) => a.ts - b.ts);
    if (candles.length < 30) throw new Error("too few candles");
    return { candles, source: "live" };
  } catch {
    return { candles: extendCandles(prev, asset, seedKey), source: "simulated" };
  }
}

/** Build the technical-analysis readout straight from indicator math. */
export function technicalReadout(
  candles: Candle[],
  source: "live" | "simulated"
): TechnicalReadout {
  const _adx = adx(candles);
  const vol = atrPct(candles);
  const bw = bollingerWidth(candles);
  const mom = momentum(candles);
  const last = candles[candles.length - 1].close;
  // Momentum carries direction; ADX scales conviction in this readout.
  const score = clamp(mom, -1, 1);
  const confidence = clamp(_adx / 50, 0.1, 1);
  const trendWord = _adx > 25 ? "strong trend" : _adx < 18 ? "no trend" : "mild trend";
  return {
    skill: "technical-analysis",
    score,
    confidence,
    adx: _adx,
    volatility: vol,
    bandWidth: bw,
    lastPrice: last,
    source,
    note: `ADX ${_adx.toFixed(0)} (${trendWord}), ATR ${vol.toFixed(2)}%, momentum ${mom.toFixed(2)}.`,
  };
}

interface SkillHubResponse {
  score: number; // -1..1
  confidence?: number; // 0..1
  summary?: string;
}

/** Call the real Skill Hub gateway for one skill, if configured. */
async function callSkillHub(
  skill: string,
  asset: AssetId
): Promise<SkillHubResponse | null> {
  const url = process.env.BITGET_SKILLHUB_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/skill/${skill}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BITGET_API_KEY
          ? { Authorization: `Bearer ${process.env.BITGET_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ asset, symbol: asset }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as SkillHubResponse;
    if (typeof j.score !== "number") return null;
    return j;
  } catch {
    return null;
  }
}

/**
 * Derived fallback for the four non-technical skills. Each derives a distinct,
 * defensible view from the same price action so the consensus has genuine
 * disagreement to resolve — not five copies of one number.
 */
function deriveSignal(
  skill: Exclude<SkillSignal["skill"], "technical-analysis">,
  asset: AssetId,
  candles: Candle[],
  tech: TechnicalReadout
): SkillSignal {
  const closes = candles.map((c) => c.close);
  const ret7 = (closes.at(-1)! - closes.at(-8)!) / closes.at(-8)!;
  const ret30 = (closes.at(-1)! - closes.at(-31)!) / closes.at(-31)!;
  const vol = tech.volatility;
  let score = 0;
  let confidence = 0.5;
  let note = "";

  switch (skill) {
    case "macro-analyst": {
      // Slow lens: leans on the 30-bar drift, dampened by high volatility.
      score = clamp(ret30 * 8 - vol * 0.02, -1, 1);
      confidence = clamp(0.5 + Math.abs(ret30) * 4, 0.2, 0.9);
      note = `30-bar drift ${(ret30 * 100).toFixed(1)}% framed against a ${vol > 3 ? "risk-off" : "stable"} vol backdrop.`;
      break;
    }
    case "sentiment-analyst": {
      // Reactive lens: recent momentum, amplified for the meme coin.
      const amp = asset === "DOGEUSDT" ? 1.6 : 1.0;
      score = clamp(ret7 * 12 * amp, -1, 1);
      confidence = clamp(0.4 + Math.abs(ret7) * 6, 0.2, 0.95);
      note = `7-bar momentum ${(ret7 * 100).toFixed(1)}%${asset === "DOGEUSDT" ? " (meme beta amplified)" : ""}.`;
      break;
    }
    case "market-intel": {
      // Flow lens: blends momentum with a volume-trend read.
      const v1 = candles.slice(-10).reduce((a, c) => a + c.volume, 0);
      const v0 = candles.slice(-20, -10).reduce((a, c) => a + c.volume, 0);
      const volTrend = v0 ? (v1 - v0) / v0 : 0;
      score = clamp(Math.sign(ret7) * Math.min(Math.abs(ret7) * 8, 1) * 0.7 + volTrend * 0.5, -1, 1);
      confidence = clamp(0.45 + Math.abs(volTrend), 0.2, 0.9);
      note = `Volume ${volTrend >= 0 ? "expanding" : "fading"} ${(volTrend * 100).toFixed(0)}% vs prior window.`;
      break;
    }
    case "news-briefing": {
      // Event lens: contrarian on stretched moves, supportive otherwise.
      const stretched = Math.abs(ret7) > 0.08;
      score = clamp((stretched ? -Math.sign(ret7) * 0.4 : Math.sign(ret30) * 0.5), -1, 1);
      confidence = stretched ? 0.4 : 0.55;
      note = stretched
        ? "Move looks headline-stretched; flags mean-reversion risk."
        : "No outsized catalyst; defers to underlying drift.";
      break;
    }
  }
  return { skill, score, confidence, note, source: "simulated" };
}

/** Gather all five skill signals for one asset. */
export async function gatherSignals(
  asset: AssetId,
  candles: Candle[],
  candleSource: "live" | "simulated"
): Promise<SkillSignal[]> {
  const tech = technicalReadout(candles, candleSource);
  const others: SkillSignal["skill"][] = [
    "macro-analyst",
    "sentiment-analyst",
    "market-intel",
    "news-briefing",
  ];

  const derived = await Promise.all(
    others.map(async (skill) => {
      const hub = await callSkillHub(skill, asset);
      if (hub) {
        return {
          skill,
          score: clamp(hub.score, -1, 1),
          confidence: clamp(hub.confidence ?? 0.6, 0.1, 1),
          note: hub.summary ?? "Live Skill Hub read.",
          source: "live" as const,
        };
      }
      return deriveSignal(
        skill as Exclude<SkillSignal["skill"], "technical-analysis">,
        asset,
        candles,
        tech
      );
    })
  );

  return [tech, ...derived];
}
