# Augur

### Reads the signs. Explains the call.

**Bitget AI Hackathon S1 — Trading Agent track**

Augur is an AI trading agent that consults **five Bitget Skill Hub skills** every cycle, fuses them into
a single **confidence-weighted consensus vote**, switches strategy by **market regime**, explains every
decision in natural language via the **MuleRun API**, and **re-weights each skill based on how right it
has been**. It paper-trades BTC, ETH, and a meme coin (DOGE), logging every decision — flat ones
included — to a committed JSON file that serves as a public, verifiable trading record.

> Live demo: **https://YOUR-DEPLOYMENT.vercel.app** _(fill in after deploying — see “Deploy” below)_

---

## Thesis

**Problem — one model, one lens, one blind spot.**
Most automated strategies commit to a single view of the market: a momentum rule, a mean-reversion
band, one model's opinion. That works until the regime changes underneath it. A trend system bleeds in
chop; a fade system gets run over in a breakout. The market is not one thing, and no single signal is
right across all of them.

**Approach — five signals, one weighted vote, switched by regime.**
The agent pulls a score in `[-1, +1]` from each of five skills (macro, sentiment, technical, market
intel, news). It first classifies the regime from technical structure — *trending / ranging / unclear*
— then runs a confidence-weighted consensus. **Trend-follow when trending, mean-revert when ranging,
stand flat when unclear.** A position only opens when conviction clears a deliberately conservative
threshold.

**Why an agent — continuous synthesis no static script can do.**
Fusing five independent perception streams, re-classifying the regime, re-weighting the vote, writing a
defensible rationale, and logging it — every cycle, across three assets — is a synthesis task, not a
rule. It needs a system that perceives broadly and reasons over the *combination* in natural language.
That is agent-shaped work, not a backtest formula.

**What's novel — it grades its own sources and re-weights them.**
After every simulated trade closes, the agent compares each skill's directional call against what price
actually did and nudges that skill's weight up or down (an exponential adjustment, clamped to
`[0.05, 0.5]` and renormalized to sum to 1). The committee that decides tomorrow is shaped by who was
right yesterday.

---

## How it works (one cycle)

1. **Perceive** — pull all five skill scores for BTC, ETH, DOGE.
2. **Classify regime** — ADX-style trend strength + ATR/Bollinger volatility → trending / ranging / unclear (`lib/regime.ts`).
3. **Weighted vote** — combine scores by each skill's learned weight × confidence into one conviction number (`lib/consensus.ts`).
4. **Decide** — trend-follow / mean-revert / stay-flat, only acting past the conservative threshold.
5. **Explain** — generate a natural-language rationale via MuleRun (`lib/mulerun.ts`).
6. **Log & learn** — append the decision to `data/trades.json`; on close, re-weight every skill by its accuracy (`lib/engine.ts`).

---

## Data provenance (read this)

Every logged record carries `source: "live" | "simulated"` and the rationale carries its own
`rationaleSource`, so provenance is never ambiguous.

- **Technical-analysis** is always computed from real indicator math (`lib/indicators.ts`) on whatever
  candles are available.
- With **`BITGET_SKILLHUB_URL` + keys set and an open network**, candles come from Bitget's public v2
  REST API and the four non-technical skills come from the live Skill Hub → records are tagged `live`.
- **Without** them, candles fall back to a deterministic synthesizer and the four skills derive distinct,
  defensible views from real price action → records are tagged `simulated`.

The integration code for the live path is complete and correct; flipping to live needs only credentials
and network access — no code changes.

---

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 (glassmorphism) · Framer Motion · Recharts ·
Bitget Skill Hub / public market API · MuleRun (rationale) · local JSON files as the trading log ·
Vercel-deployable, zero paid services.

---

## Setup

```bash
npm install
cp .env.example .env        # then fill in the values below
```

Per the hackathon setup steps:

```bash
npm install -g @bitget-ai/getagent-skill   # Skill Hub CLI
npx bitget-hub install --target codex      # Bitget MCP
```

### Environment variables (`.env`)

| Var | Purpose |
| --- | --- |
| `BITGET_API_KEY` / `BITGET_SECRET_KEY` / `BITGET_PASSPHRASE` | Bitget auth (**read / sim-trade only — no live-trade permission**). |
| `BITGET_SKILLHUB_URL` | Skill Hub gateway base URL. Unset → derived-signal fallback. |
| `MULERUN_API_KEY` | MuleRun rationale generation. Sign up at [mulerun.com](https://mulerun.com), claim 2000 credits at [credits.mule.page](https://credits.mule.page) with code **`0526BITGET`**. |
| `MULERUN_BASE_URL` / `MULERUN_MODEL` | Defaults `https://api.mulerun.com/v1` and `gpt-4o-mini`. |

---

## Running a perception cycle

**CLI** (runs `N` cycles, defaults to 1):

```bash
npm run cycle        # one cycle
npm run cycle 5      # five cycles
```

**HTTP** (for a cron or the dashboard button):

```bash
curl -X POST http://localhost:3000/api/run-cycle
```

**Dev server:**

```bash
npm run dev          # http://localhost:3000
```

- `/` — the thesis.
- `/dashboard` — per-asset regime badges, skill-weight evolution chart, cumulative PnL chart, live decision feed, and a **Run perception cycle** button.
- `/logs` — the full sortable trade table; click any row for the per-skill score breakdown.

---

## Reading the trade log

`data/trades.json` is the verifiable artifact. Each record:

```jsonc
{
  "id": "…", "timestamp": "ISO-8601",
  "asset": "BTCUSDT", "regime": "trending", "strategy": "trend-follow",
  "signals": [ { "skill": "technical-analysis", "score": 0.42, "confidence": 0.7, "note": "…", "source": "live" }, … ],
  "weights": { "macro-analyst": 0.19, … },
  "weightedScore": 0.31, "conviction": 0.31, "direction": "long",
  "rationale": "…", "rationaleSource": "live",
  "entryPrice": 64012.5, "exitPrice": 64550.1, "pnlPct": 0.0084,
  "status": "closed", "source": "live"
}
```

`data/weights.json` holds the current skill weights plus a `history[]` of snapshots that drives the
weight-evolution chart. `GET /api/trades` also returns a rolled-up summary (cumulative PnL, win rate).

---

## Deploy (Vercel free tier)

```bash
npm i -g vercel
vercel            # first deploy
vercel --prod     # production
```

Set the same env vars in the Vercel project settings. `vercel.json` includes an optional cron that
calls `/api/run-cycle` once daily (Vercel's Hobby plan allows daily cron jobs; bump to a finer schedule
on Pro). After deploying, paste the URL at the top of this README.

> Note: on Vercel's serverless filesystem, writes to `data/*.json` are ephemeral per-invocation. For a
> continuously-growing **committed** log, run cycles locally (`npm run cycle`) and commit the JSON, or
> point the store at a small KV/blob store. Local + committed JSON is the canonical submission artifact.

---

## Safety

Read / simulated-trade permissions only. The agent never places live orders — all PnL is paper-traded.
