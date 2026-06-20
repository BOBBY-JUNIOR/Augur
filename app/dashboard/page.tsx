"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WeightChart } from "@/components/charts/WeightChart";
import { PnlChart } from "@/components/charts/PnlChart";
import {
  ASSET_LABEL,
  DIRECTION_STYLE,
  fmtPct,
  fmtPrice,
  fmtTime,
  REGIME_STYLE,
  SKILL_META,
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

  // Latest decision per asset (newest-first list → first match wins).
  const latest = (asset: string) =>
    data?.trades.find((t) => t.asset === asset);

  const liveMode = data?.trades[0]?.source === "live";

  return (
    <main className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Live Dashboard
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  liveMode ? "bg-emerald-400" : "bg-amber-400"
                } live-dot`}
              />
              {liveMode
                ? "Live Skill Hub + market data"
                : "Simulated perception (configure API keys for live data)"}
            </p>
          </div>
          <button
            onClick={runCycle}
            disabled={running}
            className="glass-hover rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-200 hover:scale-[1.02] disabled:opacity-60"
          >
            {running ? "Running cycle…" : "▶ Run perception cycle"}
          </button>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Decisions logged" value={data?.count ?? "—"} />
          <Stat
            label="Cumulative PnL"
            value={data ? fmtPct(data.summary.cumulativePnlPct) : "—"}
            tone={
              (data?.summary.cumulativePnlPct ?? 0) >= 0 ? "pos" : "neg"
            }
          />
          <Stat
            label="Win rate"
            value={
              data ? `${(data.summary.winRate * 100).toFixed(0)}%` : "—"
            }
          />
          <Stat
            label="Open positions"
            value={data?.summary.open ?? "—"}
          />
        </div>

        {/* Regime badges */}
        <h2 className="mt-10 text-sm font-medium uppercase tracking-widest text-gray-500">
          Per-asset regime
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ASSETS.map((asset) => {
            const d = latest(asset);
            const rs = d ? REGIME_STYLE[d.regime] : REGIME_STYLE.unclear;
            const ds = d ? DIRECTION_STYLE[d.direction] : DIRECTION_STYLE.flat;
            return (
              <div key={asset} className="glass glass-hover rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">
                    {ASSET_LABEL[asset]}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ds.cls}`}
                  >
                    {ds.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: rs.dot }}
                  />
                  <span className={`text-sm ${rs.cls.split(" ")[0]}`}>
                    {rs.label}
                  </span>
                  {d && (
                    <span className="ml-auto text-xs text-gray-500">
                      {d.strategy}
                    </span>
                  )}
                </div>
                {d && (
                  <div className="mt-4 space-y-1.5">
                    <Bar label="Conviction" value={d.conviction} />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>score {d.weightedScore.toFixed(2)}</span>
                      <span>@ {fmtPrice(d.entryPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Panel
            title="Skill weight evolution"
            sub="How much of the vote each skill earns, updated after every close"
          >
            <WeightChart history={weights?.history ?? []} />
            <Legend />
          </Panel>
          <Panel
            title="Cumulative simulated PnL"
            sub="Realized paper-trading performance across closed positions"
          >
            <PnlChart trades={data?.trades ?? []} />
          </Panel>
        </div>

        {/* Decision feed */}
        <h2 className="mt-10 text-sm font-medium uppercase tracking-widest text-gray-500">
          Decision feed
        </h2>
        <div className="feed-scroll mt-3 max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {(data?.trades ?? []).slice(0, 40).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
            >
              <FeedRow t={t} />
            </motion.div>
          ))}
          {!data?.trades.length && (
            <div className="glass rounded-2xl p-6 text-sm text-gray-500">
              No decisions yet. Hit “Run perception cycle”.
            </div>
          )}
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
  value: string | number;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold ${
          tone === "pos"
            ? "text-emerald-300"
            : tone === "neg"
              ? "text-rose-300"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
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
    <div className="glass rounded-2xl p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {SKILLS.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-xs text-gray-400">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: SKILL_META[s].color }}
          />
          {SKILL_META[s].label}
        </span>
      ))}
    </div>
  );
}

function FeedRow({ t }: { t: TradeRecord }) {
  const ds = DIRECTION_STYLE[t.direction];
  const rs = REGIME_STYLE[t.regime];
  return (
    <div className="glass glass-hover rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white">
          {ASSET_LABEL[t.asset]}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ds.cls}`}>
          {ds.label}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${rs.cls}`}>
          {rs.label}
        </span>
        <span className="text-xs text-gray-500">conv {(t.conviction * 100).toFixed(0)}%</span>
        {t.status === "closed" && (
          <span
            className={`text-xs font-medium ${
              (t.pnlPct ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {fmtPct(t.pnlPct)}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <SourceTag source={t.source} />
          {fmtTime(t.timestamp)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{t.rationale}</p>
    </div>
  );
}

function SourceTag({ source }: { source: "live" | "simulated" }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
        source === "live"
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-amber-400/10 text-amber-300"
      }`}
    >
      {source}
    </span>
  );
}
