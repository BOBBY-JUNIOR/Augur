// ── Run-cycle engine ────────────────────────────────────────────────────────
// One cycle = close prior open positions (learning from the outcome) → perceive
// every asset via the five skills → classify regime → run weighted consensus →
// decide → generate rationale → log. Weights self-correct after each close.

import crypto from "node:crypto";
import { gatherSignals, getCandles } from "./bitget";
import { clamp } from "./indicators";
import { ACTION_THRESHOLD, decide } from "./consensus";
import { generateRationale } from "./llm";
import { classifyRegime, strategyForRegime } from "./regime";
import {
  readMarket,
  readTrades,
  readWeights,
  writeMarket,
  writeTrades,
  writeWeights,
} from "./store";
import {
  ASSETS,
  SKILLS,
  type CycleResult,
  type DataSource,
  type SkillId,
  type TechnicalReadout,
  type TradeRecord,
  type Weights,
} from "./types";

const WEIGHT_FLOOR = 0.05;
const WEIGHT_CEIL = 0.5;
const LEARN_RATE = 0.18;

/** EMA-style weight nudge based on whether each skill's call matched the move. */
function adjustWeights(w: Weights, trade: TradeRecord): Weights {
  if (trade.exitPrice == null) return w;
  const moveSign = Math.sign(trade.exitPrice - trade.entryPrice);
  const raw: Record<SkillId, number> = { ...w.weights };

  if (moveSign !== 0) {
    for (const skill of SKILLS) {
      const sig = trade.signals.find((s) => s.skill === skill);
      if (!sig) continue;
      const callSign = Math.sign(sig.score);
      if (callSign === 0) continue;
      const correct = callSign === moveSign;
      const strength = Math.abs(sig.score); // stronger calls earn/lose more
      const factor = 1 + (correct ? 1 : -1) * LEARN_RATE * (0.5 + strength);
      raw[skill] = w.weights[skill] * factor;
    }
  }

  // Clamp, then renormalize to sum to 1 (per the brief).
  for (const skill of SKILLS) raw[skill] = clamp(raw[skill], WEIGHT_FLOOR, WEIGHT_CEIL);
  const sum = SKILLS.reduce((a, s) => a + raw[s], 0);
  const weights = Object.fromEntries(
    SKILLS.map((s) => [s, raw[s] / sum])
  ) as Record<SkillId, number>;

  return { ...w, weights, updates: w.updates + 1 };
}

function pnlPct(trade: TradeRecord, exit: number): number {
  const gross = (exit - trade.entryPrice) / trade.entryPrice;
  return trade.direction === "short" ? -gross : gross;
}

export interface CycleOptions {
  /** Override the seed so simulated runs can be made reproducible in tests. */
  seedKey?: string;
}

export async function runCycle(opts: CycleOptions = {}): Promise<CycleResult> {
  const ranAt = new Date().toISOString();
  let trades = await readTrades();
  let weights = await readWeights();

  // Seed varies per cycle so successive simulated cycles explore new regimes.
  const cycleIndex = weights.history.length;
  const seedKey = opts.seedKey ?? `${ranAt.slice(0, 13)}-${cycleIndex}`;

  // Pre-fetch candles once per asset (reused for closing + new decisions).
  // Prior series is passed so simulated prices stay continuous across cycles.
  const prevMarket = await readMarket();
  const market = await Promise.all(
    ASSETS.map(async (asset) => {
      const { candles, source } = await getCandles(
        asset,
        `${asset}-${seedKey}`,
        prevMarket[asset]
      );
      return { asset, candles, source, last: candles[candles.length - 1].close };
    })
  );
  await writeMarket(
    Object.fromEntries(market.map((m) => [m.asset, m.candles]))
  );
  const priceOf = (asset: string) =>
    market.find((m) => m.asset === asset)!.last;

  // ── 1. Close open positions and learn from each outcome ──
  const closed: TradeRecord[] = [];
  for (const t of trades) {
    if (t.status !== "open") continue;
    const exit = priceOf(t.asset);
    t.exitPrice = exit;
    t.pnlPct = pnlPct(t, exit);
    t.status = "closed";
    weights = adjustWeights(weights, t);
    closed.push(t);
  }

  // ── 2. Perceive + decide for each asset ──
  const decisions: TradeRecord[] = [];
  for (const m of market) {
    const signals = await gatherSignals(m.asset, m.candles, m.source);
    const tech = signals.find(
      (s) => s.skill === "technical-analysis"
    ) as TechnicalReadout;
    const regime = classifyRegime(tech);
    const strategy = strategyForRegime(regime);
    const { weightedScore, conviction, direction } = decide(
      signals,
      weights.weights,
      regime,
      strategy
    );

    const { text: rationale, source: rationaleSource } = await generateRationale({
      asset: m.asset,
      regime,
      strategy,
      direction,
      weightedScore,
      conviction,
      signals,
      weights: weights.weights,
    });

    const overall: DataSource =
      m.source === "live" && signals.every((s) => s.source === "live")
        ? "live"
        : "simulated";

    decisions.push({
      id: crypto.randomUUID(),
      timestamp: ranAt,
      asset: m.asset,
      regime,
      strategy,
      signals,
      weights: { ...weights.weights },
      weightedScore,
      conviction,
      direction,
      rationale,
      rationaleSource,
      entryPrice: m.last,
      status: direction === "flat" ? "flat" : "open",
      source: overall,
    });
  }

  // ── 3. Record a weight snapshot for the evolution chart ──
  weights = {
    ...weights,
    updatedAt: ranAt,
    history: [
      ...weights.history,
      { t: ranAt, updates: weights.updates, weights: { ...weights.weights } },
    ].slice(-200),
  };

  // ── 4. Persist (newest decisions first in the log) ──
  trades = [...decisions, ...trades];
  await writeTrades(trades);
  await writeWeights(weights);

  return { ranAt, decisions, closed, weights };
}

export { ACTION_THRESHOLD };
