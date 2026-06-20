// ── Core domain types for the Adaptive Consensus Trading Agent ──────────────

/** The five Bitget Skill Hub skills the agent consults each cycle. */
export const SKILLS = [
  "macro-analyst",
  "sentiment-analyst",
  "technical-analysis",
  "market-intel",
  "news-briefing",
] as const;

export type SkillId = (typeof SKILLS)[number];

/** Assets under management: BTC, ETH, and one meme coin. */
export const ASSETS = ["BTCUSDT", "ETHUSDT", "DOGEUSDT"] as const;
export type AssetId = (typeof ASSETS)[number];

export type Regime = "trending" | "ranging" | "unclear";
export type Direction = "long" | "short" | "flat";
export type StrategyMode = "trend-follow" | "mean-revert" | "stay-flat";
export type DataSource = "live" | "simulated";

/** A single skill's read on one asset: a score in [-1, +1] plus a one-liner. */
export interface SkillSignal {
  skill: SkillId;
  /** -1 (max bearish) … +1 (max bullish). */
  score: number;
  /** 0..1 — how strongly the skill holds this view; scales its vote. */
  confidence: number;
  note: string;
  source: DataSource;
}

/** Technical-analysis emits richer structure used for regime detection. */
export interface TechnicalReadout extends SkillSignal {
  skill: "technical-analysis";
  adx: number; // trend strength (ADX-style), 0..100
  volatility: number; // ATR% of price
  bandWidth: number; // Bollinger band width (normalized)
  lastPrice: number;
}

export interface Weights {
  weights: Record<SkillId, number>;
  /** How many closed trades have informed the current weights. */
  updates: number;
  updatedAt: string;
  /** Snapshot history for the weight-evolution chart. */
  history: WeightSnapshot[];
}

export interface WeightSnapshot {
  t: string;
  updates: number;
  weights: Record<SkillId, number>;
}

/** A logged paper-trade / decision record. */
export interface TradeRecord {
  id: string;
  timestamp: string;
  asset: AssetId;
  regime: Regime;
  strategy: StrategyMode;
  signals: SkillSignal[];
  weights: Record<SkillId, number>;
  /** Weighted, regime-aware consensus score in [-1, +1]. */
  weightedScore: number;
  /** 0..1 absolute conviction used for the act/flat threshold. */
  conviction: number;
  direction: Direction;
  rationale: string;
  rationaleSource: DataSource;
  entryPrice: number;
  /** Filled when the trade is marked closed by a later cycle. */
  exitPrice?: number;
  pnlPct?: number;
  status: "open" | "closed" | "flat";
  /** Overall provenance of the market perception for this decision. */
  source: DataSource;
}

export interface CycleResult {
  ranAt: string;
  decisions: TradeRecord[];
  closed: TradeRecord[];
  weights: Weights;
}
