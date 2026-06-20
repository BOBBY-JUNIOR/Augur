"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ASSET_LABEL,
  DIRECTION_STYLE,
  fmtPct,
  fmtPrice,
  fmtTime,
  REGIME_STYLE,
} from "@/lib/ui";
import type { TradeRecord } from "@/lib/types";

type SortKey = "timestamp" | "asset" | "regime" | "direction" | "conviction" | "pnlPct";

export default function Logs() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [sort, setSort] = useState<SortKey>("timestamp");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trades", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTrades(d.trades ?? []));
  }, []);

  const sorted = useMemo(() => {
    const arr = [...trades];
    arr.sort((a, b) => {
      const av = a[sort] ?? (sort === "pnlPct" ? -Infinity : "");
      const bv = b[sort] ?? (sort === "pnlPct" ? -Infinity : "");
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [trades, sort, dir]);

  const toggle = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(-1);
    }
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: "timestamp", label: "Time" },
    { key: "asset", label: "Asset" },
    { key: "regime", label: "Regime" },
    { key: "direction", label: "Dir" },
    { key: "conviction", label: "Conv" },
    { key: "pnlPct", label: "PnL" },
  ];

  return (
    <main className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Paper-Trading Log
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          The verifiable submission artifact — every decision the agent has ever
          made, served straight from{" "}
          <code className="text-gray-300">data/trades.json</code>. Click a row for
          the full skill breakdown. Sortable by any column.
        </p>

        <div className="glass mt-6 overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggle(c.key)}
                      className="cursor-pointer select-none px-4 py-3 font-medium hover:text-gray-300"
                    >
                      {c.label}
                      {sort === c.key && (
                        <span className="ml-1 text-cyan-400">
                          {dir === 1 ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const open = expanded === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr
                        onClick={() => setExpanded(open ? null : t.id)}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                          {fmtTime(t.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {ASSET_LABEL[t.asset]}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${REGIME_STYLE[t.regime].cls.split(" ")[0]}`}>
                            {REGIME_STYLE[t.regime].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${DIRECTION_STYLE[t.direction].cls}`}
                          >
                            {DIRECTION_STYLE[t.direction].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {(t.conviction * 100).toFixed(0)}%
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            t.pnlPct == null
                              ? "text-gray-600"
                              : t.pnlPct >= 0
                                ? "text-emerald-300"
                                : "text-rose-300"
                          }`}
                        >
                          {t.status === "closed" ? fmtPct(t.pnlPct) : t.status}
                        </td>
                        <td className="max-w-[280px] truncate px-4 py-3 text-gray-400">
                          {t.rationale}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <td colSpan={7} className="px-4 py-4">
                            <Detail t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      No trades logged yet. Run a cycle from the dashboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail({ t }: { t: TradeRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="text-xs uppercase tracking-wider text-gray-500">
          Skill signals → weighted vote {t.weightedScore.toFixed(2)}
        </div>
        <div className="mt-2 space-y-1.5">
          {t.signals.map((s) => (
            <div key={s.skill} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 text-gray-400">{s.skill}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
                <div
                  className={`absolute top-0 h-full rounded-full ${
                    s.score >= 0 ? "bg-emerald-400/70" : "bg-rose-400/70"
                  }`}
                  style={{
                    left: "50%",
                    width: `${(Math.abs(s.score) / 2) * 100}%`,
                    transform: s.score >= 0 ? "none" : "translateX(-100%)",
                  }}
                />
                <div className="absolute left-1/2 top-[-2px] h-[10px] w-px bg-white/20" />
              </div>
              <span className="w-12 shrink-0 text-right text-gray-300">
                {s.score.toFixed(2)}
              </span>
              <span className="w-16 shrink-0 text-right text-gray-500">
                w {(t.weights[s.skill] ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 text-xs text-gray-400">
        <div className="grid grid-cols-2 gap-2">
          <Field k="Strategy" v={t.strategy} />
          <Field k="Entry" v={fmtPrice(t.entryPrice)} />
          <Field k="Exit" v={t.exitPrice ? fmtPrice(t.exitPrice) : "—"} />
          <Field k="Status" v={t.status} />
          <Field k="Perception" v={t.source} />
          <Field k="Rationale by" v={t.rationaleSource} />
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 leading-relaxed text-gray-300">
          {t.rationale}
        </div>
        <div className="font-mono text-[10px] text-gray-600">id {t.id}</div>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{k}</div>
      <div className="mt-0.5 text-gray-200">{v}</div>
    </div>
  );
}
