// Shared presentation helpers + skill/asset theming for the UI layer.
import type { Direction, Regime, SkillId } from "./types";

export const SKILL_META: Record<SkillId, { label: string; color: string }> = {
  "macro-analyst": { label: "Macro", color: "#22d3ee" },
  "sentiment-analyst": { label: "Sentiment", color: "#8b5cf6" },
  "technical-analysis": { label: "Technical", color: "#34d399" },
  "market-intel": { label: "Market Intel", color: "#f59e0b" },
  "news-briefing": { label: "News", color: "#f472b6" },
};

export const ASSET_LABEL: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  DOGEUSDT: "DOGE",
};

export const REGIME_STYLE: Record<Regime, { label: string; cls: string; dot: string }> = {
  trending: {
    label: "Trending",
    cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    dot: "#34d399",
  },
  ranging: {
    label: "Ranging",
    cls: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    dot: "#f59e0b",
  },
  unclear: {
    label: "Unclear",
    cls: "text-gray-300 border-white/15 bg-white/5",
    dot: "#9ca3af",
  },
};

export const DIRECTION_STYLE: Record<Direction, { label: string; cls: string }> = {
  long: { label: "LONG", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" },
  short: { label: "SHORT", cls: "text-rose-300 bg-rose-400/10 border-rose-400/30" },
  flat: { label: "FLAT", cls: "text-gray-400 bg-white/5 border-white/15" },
};

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
