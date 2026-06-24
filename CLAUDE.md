# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Augur** — a multi-signal consensus paper-trading agent for the Bitget AI Hackathon S1 (Trading Agent track). Each cycle it consults five "skills" per asset (BTC/ETH/DOGE), fuses their scores into a regime-aware weighted vote, decides a direction, writes an LLM rationale, logs the decision, and re-weights each skill by how right it has been. Next.js 15 App Router + TypeScript; the trade log lives in committed JSON files.

## Commands

```bash
npm run dev          # Next dev server → http://localhost:3000
npm run build        # next build
npm run lint         # next lint
npm run cycle        # run ONE perception→decision→log cycle (CLI, via tsx)
npm run cycle 5      # run N cycles
```

Trigger a cycle over HTTP (used by cron + the dashboard button): `curl -X POST http://localhost:3000/api/run-cycle` (GET also works).

There is **no test suite**. `runCycle({ seedKey })` accepts a seed override to make simulated runs reproducible if you add one.

## Architecture

The whole agent is one function — `runCycle()` in `lib/engine.ts`. Read that first; everything else is a helper it calls. One cycle, in order:

1. **Load state** — `lib/store.ts` reads `data/{trades,weights,market}.json`.
2. **Get candles** — `getCandles()` in `lib/bitget.ts`, once per asset, reused for both closing and deciding.
3. **Close open positions & learn** — every `status:"open"` trade is closed at the new price; `adjustWeights()` nudges each skill's weight by whether its directional call matched the realized move (EMA-style, clamped `[0.05, 0.5]`, renormalized to sum to 1).
4. **Perceive** — `gatherSignals()` returns five `SkillSignal`s per asset.
5. **Classify regime** — `classifyRegime()` in `lib/regime.ts` reads the technical readout (ADX / ATR% / Bollinger width) → `trending | ranging | unclear` → strategy `trend-follow | mean-revert | stay-flat`.
6. **Decide** — `decide()` in `lib/consensus.ts` computes a confidence-weighted score, then maps it to a direction *per strategy* (trend-follow acts WITH consensus; mean-revert fades it and needs extra conviction; stay-flat never trades). Action gated by `ACTION_THRESHOLD`.
7. **Explain** — `generateRationale()` in `lib/llm.ts`.
8. **Persist** — newest decisions prepended to `trades.json`; a weight snapshot appended to `weights.json` history (last 200).

### The live/simulated duality (important)

Every signal and rationale carries a `source: "live" | "simulated"` (and `rationaleSource`) tag — provenance is never dropped. The code path is identical either way; only the data source changes based on env vars + network:

- **Candles**: live Bitget public REST (`api.bitget.com/api/v2/spot/market/candles`) when reachable; on *any* failure falls back to `extendCandles()`, a deterministic synthesizer seeded per-cycle that continues the prior `market.json` series so simulated prices stay continuous.
- **technical-analysis skill**: ALWAYS computed from real indicator math in `lib/indicators.ts` — never faked.
- **The other four skills** (macro/sentiment/market-intel/news): come from the Skill Hub gateway when `BITGET_SKILLHUB_URL` is set and reachable; otherwise `deriveSignal()` derives four *distinct* views from real price action so the consensus has genuine disagreement to resolve.

Flipping to fully live needs only credentials + network, no code changes. When editing data sources, preserve the `source` tagging — the UI and the README's provenance claims depend on it.

### LLM rationale (provider-swappable)

`lib/llm.ts` selects a provider by `LLM_PROVIDER` (`groq` default, or `mulerun`) — both OpenAI-compatible `/chat/completions`. No API key, non-200, or thrown request → `templateRationale()` deterministic fallback tagged `simulated`. Provider failures are logged via `console.warn` (do not silently swallow them — see commit `ae4b519`).

### Data model

`lib/types.ts` is the single source of truth. `SKILLS` and `ASSETS` are `as const` tuples — iterate over these rather than hardcoding skill/asset lists. The committed JSON files (`data/trades.json`, `data/weights.json`) ARE the submission artifact, so cycle runs produce reviewable diffs — expect to commit them.

### Web layer

App Router pages: `/` (thesis, `app/page.tsx`), `/dashboard` (regime badges, weight + PnL charts via Recharts, run button), `/logs` (sortable trade table). API routes (`app/api/*`) are `runtime:"nodejs"` + `force-dynamic` because they touch the filesystem. `/api/trades` returns the log plus a rolled-up summary (cumulative PnL, win rate). UI is Tailwind v4 + Framer Motion; shared helpers in `lib/ui.ts`, components in `components/`.

## Deployment note

`vercel.json` runs a daily cron (Hobby plan allows daily only) hitting `/api/run-cycle`. **Vercel's filesystem is ephemeral** — writes to `data/*.json` don't persist across invocations there. The canonical growing log comes from running cycles locally and committing the JSON.
