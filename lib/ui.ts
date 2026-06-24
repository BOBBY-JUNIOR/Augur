// Shared presentation helpers + skill/asset theming for the war-room UI.
import type { Direction, Regime, SkillId } from "./types";

export type Tone = "amber" | "rust" | "mute";

// Cohesive cool line colors for the 5 skills (charts + legends) — a calm
// emerald→violet sweep, all distinct on a line chart, none colliding with the
// rose loss/short hue.
export const SKILL_META: Record<SkillId, { label: string; color: string }> = {
  "macro-analyst": { label: "Macro", color: "#34d399" },
  "sentiment-analyst": { label: "Sentiment", color: "#2dd4bf" },
  "technical-analysis": { label: "Technical", color: "#38bdf8" },
  "market-intel": { label: "Market Intel", color: "#818cf8" },
  "news-briefing": { label: "News", color: "#a78bfa" },
};

export const ASSET_LABEL: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  DOGEUSDT: "DOGE",
};

export const REGIME_META: Record<Regime, { label: string; tone: Tone; dot: string }> = {
  trending: { label: "Trending", tone: "amber", dot: "#34d399" },
  ranging: { label: "Ranging", tone: "rust", dot: "#f43f5e" },
  unclear: { label: "Unclear", tone: "mute", dot: "#5c6370" },
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
