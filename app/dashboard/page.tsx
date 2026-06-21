"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WeightChart } from "@/components/charts/WeightChart";
import { PnlChart } from "@/components/charts/PnlChart";
import {
  ASSET_LABEL,
  DIRECTION_META,
  fmtPct,
  fmtPrice,
  fmtTime,
  pnlColor,
  REGIME_META,
  scoreVerdict,
  SKILL_META,
  tagClass,
  toneText,
} from "@/lib/ui";
import { ASSETS, SKILLS, type TradeRecord, type Weights } from "@/lib/types";

interface TradesPayload {
  count: number;
  summary: {
    closed: number;
    open: number;
    flat: number;
    cumulativePnlPct: number;
    winRate: number;
  };
  trades: TradeRecord[];
}

export default function Dashboard() {
  const [data, setData] = useState<TradesPayload | null>(null);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const [t, w] = await Promise.all([
      fetch("/api/trades", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/weights", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setData(t);
    setWeights(w);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCycle = async () => {
    setRunning(true);
    try {
      await fetch("/api/run-cycle", { method: "POST" });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const latest = (asset: string) => data?.trades.find((t) => t.asset === asset);
  const liveMode = data?.trades[0]?.source === "live";

  return (
    <main className="bg-warroom min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Live operations</p>
            <h1 className="display mt-3 text-4xl">The war room</h1>
            <p className="mono mt-3 flex items-center gap-2 text-xs text-faint">
              <span
                className={`h-1.5 w-1.5 rounded-full ${liveMode ? "bg-amber" : "bg-rust"} live-dot`}
              />
              {liveMode
                ? "LIVE SKILL HUB + MARKET DATA"
                : "SIMULATED PERCEPTION · SET API KEYS FOR LIVE DATA"}
            </p>
          </div>
          <button onClick={runCycle} disabled={running} className="btn btn-primary disabled:opacity-50">
            {running ? "Running…" : "▸ Run cycle"}
          </button>
        </div>

        {/* ── Stat strip ── */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
          <Stat label="Decisions logged" value={data ? String(data.count) : "—"} />
          <Stat
            label="Cumulative PnL"
            value={data ? fmtPct(data.summary.cumulativePnlPct) : "—"}
            tone={(data?.summary.cumulativePnlPct ?? 0) >= 0 ? "amber" : "rust"}
          />
          <Stat
            label="Win rate"
            value={data ? `${(data.summary.winRate * 100).toFixed(0)}%` : "—"}
          />
          <Stat label="Open positions" value={data ? String(data.summary.open) : "—"} />
        </div>

        {/* ── Per-asset regime ── */}
        <SectionLabel>Per-asset regime</SectionLabel>
        <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
          {ASSETS.map((asset) => {
            const d = latest(asset);
            const rm = d ? REGIME_META[d.regime] : REGIME_META.unclear;
            const dm = d ? DIRECTION_META[d.direction] : DIRECTION_META.flat;
            return (
              <div key={asset} className="bg-oxblood p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-cream">
                    {ASSET_LABEL[asset]}
                  </span>
                  <span className={tagClass(dm.tone)}>{dm.label}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.dot }} />
                  <span className={`mono text-xs uppercase tracking-wider ${toneText(rm.tone)}`}>
                    {rm.label}
                  </span>
                  {d && (
                    <span className="mono ml-auto text-[11px] uppercase tracking-wider text-faint">
                      {d.strategy}
                    </span>
                  )}
                </div>
                {d && (
                  <div className="mt-5">
                    <div className="mono flex justify-between text-[11px] uppercase tracking-wider text-faint">
                      <span>Conviction</span>
                      <span>{(d.conviction * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-px w-full bg-line">
                      <div
                        className="-mt-px h-[3px]"
                        style={{
                          width: `${Math.min(d.conviction * 100, 100)}%`,
                          background: rm.dot,
                        }}
                      />
                    </div>
                    <div className="mono mt-3 flex justify-between text-[11px] text-faint">
                      <span>score {d.weightedScore.toFixed(2)}</span>
                      <span>@ {fmtPrice(d.entryPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Charts ── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Panel title="Skill weight evolution" sub="Share of the vote each skill earns, re-graded after every close">
            <WeightChart history={weights?.history ?? []} />
            <Legend />
          </Panel>
          <Panel title="Cumulative simulated PnL" sub="Realized paper performance across closed positions">
            <PnlChart trades={data?.trades ?? []} />
          </Panel>
        </div>

        {/* ── Decision room (terminal log) ── */}
        <SectionLabel>Decision room</SectionLabel>
        <div className="panel-2">
          <div className="mono flex items-center gap-2 border-b border-line px-5 py-3 text-[11px] uppercase tracking-wider text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-amber live-dot" />
            augur://decisions — newest first
          </div>
          <div className="feed-scroll max-h-[640px] divide-y divide-[rgba(168,152,144,0.1)] overflow-y-auto">
            {(data?.trades ?? []).slice(0, 14).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(i * 0.02, 0.25) }}
              >
                <DecisionBlock t={t} />
              </motion.div>
            ))}
            {!data?.trades.length && (
              <div className="px-5 py-10 text-center text-sm text-faint">
                No decisions yet. Run a cycle.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "rust";
}) {
  const color = tone === "amber" ? "text-amber" : tone === "rust" ? "text-rust" : "text-cream";
  return (
    <div className="bg-oxblood px-5 py-6">
      <div className={`stat-num text-3xl ${color}`}>{value}</div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-4 mt-12">{children}</h2>;
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-6">
      <h3 className="font-display text-xl text-cream">{title}</h3>
      <p className="mt-1 text-sm text-faint">{sub}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {SKILLS.map((s) => (
        <span key={s} className="mono flex items-center gap-1.5 text-[11px] text-faint">
          <span className="h-2 w-2" style={{ background: SKILL_META[s].color }} />
          {SKILL_META[s].label}
        </span>
      ))}
    </div>
  );
}

function DecisionBlock({ t }: { t: TradeRecord }) {
  const dm = DIRECTION_META[t.direction];
  const rm = REGIME_META[t.regime];
  return (
    <div className="border-l-2 px-5 py-4" style={{ borderColor: rm.dot }}>
      {/* header line */}
      <div className="mono flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
        <span className="text-faint">{fmtTime(t.timestamp)}</span>
        <span className="font-semibold text-cream">{ASSET_LABEL[t.asset]}</span>
        <span className={`uppercase tracking-wider ${toneText(rm.tone)}`}>
          [REGIME: {rm.label}]
        </span>
        <span className={`uppercase tracking-wider ${toneText(dm.tone)}`}>
          [{dm.label}]
        </span>
        <span className="text-faint">conv {(t.conviction * 100).toFixed(0)}%</span>
        {t.status === "closed" && (
          <span className={pnlColor(t.pnlPct)}>{fmtPct(t.pnlPct)}</span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-faint">
          <span className={t.source === "live" ? "text-amber" : "text-faint"}>◦</span>
          {t.source}
        </span>
      </div>

      {/* skill lines */}
      <div className="mt-3 space-y-1">
        {t.signals.map((s) => {
          const v = scoreVerdict(s.score);
          return (
            <div key={s.skill} className="mono flex items-center gap-3 text-[11px]">
              <span className="w-44 shrink-0 text-mute">@{s.skill}</span>
              <span className={`w-12 shrink-0 text-right ${s.score >= 0 ? "text-amber" : "text-rust"}`}>
                {s.score >= 0 ? "+" : ""}
                {s.score.toFixed(2)}
              </span>
              <span className={`uppercase tracking-wider ${toneText(v.tone)}`}>
                [{v.label}]
              </span>
              <span className="ml-auto hidden text-faint sm:block">
                w {(t.weights[s.skill] ?? 0).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* rationale */}
      <p className="mt-3 flex gap-2 text-sm leading-relaxed text-mute">
        <span className="mono shrink-0 text-amber">›</span>
        <span>{t.rationale}</span>
      </p>
    </div>
  );
}
