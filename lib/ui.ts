// Shared presentation helpers + skill/asset theming for the war-room UI.
import type { Direction, Regime, SkillId } from "./types";

export type Tone = "amber" | "rust" | "mute";

// Warm, on-palette line colors for the 5 skills (charts + legends).
export const SKILL_META: Record<SkillId, { label: string; color: string }> = {
  "macro-analyst": { label: "Macro", color: "#d4a05c" },
  "sentiment-analyst": { label: "Sentiment", color: "#c4633a" },
  "technical-analysis": { label: "Technical", color: "#e7c896" },
  "market-intel": { label: "Market Intel", color: "#9c5a3c" },
  "news-briefing": { label: "News", color: "#cf8a52" },
};

export const ASSET_LABEL: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  DOGEUSDT: "DOGE",
};

export const REGIME_META: Record<Regime, { label: string; tone: Tone; dot: string }> = {
  trending: { label: "Trending", tone: "amber", dot: "#d4a05c" },
  ranging: { label: "Ranging", tone: "rust", dot: "#c4633a" },
  unclear: { label: "Unclear", tone: "mute", dot: "#7a6c66" },
};

export const DIRECTION_META: Record<Direction, { label: string; tone: Tone }> = {
  long: { label: "Long", tone: "amber" },
  short: { label: "Short", tone: "rust" },
  flat: { label: "Flat", tone: "mute" },
};

/** Map a tone to the shared `.tag` class set. */
export function tagClass(tone: Tone): string {
  return tone === "amber"
    ? "tag tag-amber"
    : tone === "rust"
      ? "tag tag-rust"
      : "tag tag-mute";
}

export function toneText(tone: Tone): string {
  return tone === "amber" ? "text-amber" : tone === "rust" ? "text-rust" : "text-faint";
}

/** Bull / bear / neutral label for a skill score, with its tone. */
export function scoreVerdict(score: number): { label: string; tone: Tone } {
  if (score > 0.15) return { label: "BULLISH", tone: "amber" };
  if (score < -0.15) return { label: "BEARISH", tone: "rust" };
  return { label: "NEUTRAL", tone: "mute" };
}

export function pnlColor(n: number | undefined): string {
  if (n == null) return "text-faint";
  return n >= 0 ? "text-amber" : "text-rust";
}

export function fmtPct(n: number | undefined, digits = 2): string {
  if (n == null) return "—";
  const v = n * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

export function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(5);
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
