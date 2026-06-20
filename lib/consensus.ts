// ── Weighted consensus + regime-aware direction ─────────────────────────────

import { clamp } from "./indicators";
import type {
  Direction,
  Regime,
  SkillId,
  SkillSignal,
  StrategyMode,
} from "./types";

/** Conservative action threshold on absolute conviction. */
export const ACTION_THRESHOLD = 0.28;

export interface ConsensusResult {
  weightedScore: number; // [-1, 1]
  conviction: number; // [0, 1]
  direction: Direction;
}

/**
 * Combine skill signals into a single weighted score, then translate that into
 * a trade direction subject to the regime's strategy.
 *
 *  - trend-follow: act in the direction of the consensus.
 *  - mean-revert:  act AGAINST the consensus (fade the extreme), but only when
 *                  the signal is strong enough to be a genuine extreme.
 *  - stay-flat:    never take a position (unclear regime).
 */
export function decide(
  signals: SkillSignal[],
  weights: Record<SkillId, number>,
  regime: Regime,
  strategy: StrategyMode
): ConsensusResult {
  let num = 0;
  let den = 0;
  for (const s of signals) {
    const w = (weights[s.skill] ?? 0) * s.confidence;
    num += w * s.score;
    den += w;
  }
  const weightedScore = den ? clamp(num / den, -1, 1) : 0;
  const conviction = Math.abs(weightedScore);

  let direction: Direction = "flat";

  if (strategy === "trend-follow" && conviction >= ACTION_THRESHOLD) {
    direction = weightedScore > 0 ? "long" : "short";
  } else if (strategy === "mean-revert") {
    // Only fade a meaningfully stretched score; require extra conviction.
    if (conviction >= ACTION_THRESHOLD + 0.12) {
      direction = weightedScore > 0 ? "short" : "long";
    }
  }
  // stay-flat → always flat.

  return { weightedScore, conviction, direction };
}
