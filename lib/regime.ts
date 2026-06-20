// ── Regime detection + strategy selection ───────────────────────────────────

import type { Regime, StrategyMode, TechnicalReadout } from "./types";

/**
 * Classify the market regime from the technical readout.
 *  - trending: strong directional structure (high ADX) — momentum persists.
 *  - ranging:  weak trend + contained volatility/bands — mean-reversion zone.
 *  - unclear:  conflicting signals (e.g. weak trend but expanding volatility) —
 *              the agent should stand aside.
 */
export function classifyRegime(t: TechnicalReadout): Regime {
  const { adx, volatility, bandWidth } = t;

  if (adx >= 25) return "trending";

  // Low trend strength. Decide ranging vs unclear by how contained price is.
  const contained = volatility < 3.0 && bandWidth < 0.12;
  if (adx < 20 && contained) return "ranging";

  // Weak trend but loose/expanding volatility → no clean edge.
  return "unclear";
}

/** Map a regime to the strategy mode the agent will run. */
export function strategyForRegime(regime: Regime): StrategyMode {
  switch (regime) {
    case "trending":
      return "trend-follow";
    case "ranging":
      return "mean-revert";
    case "unclear":
      return "stay-flat";
  }
}
