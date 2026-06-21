"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ASSET_LABEL,
  DIRECTION_META,
  fmtPct,
  fmtPrice,
  fmtTime,
  pnlColor,
  REGIME_META,
  tagClass,
  toneText,
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

  const cols: { key: SortKey; label: string; align?: string }[] = [
    { key: "timestamp", label: "Time" },
    { key: "asset", label: "Asset" },
    { key: "regime", label: "Regime" },
    { key: "direction", label: "Dir" },
    { key: "conviction", label: "Conv", align: "text-right" },
    { key: "pnlPct", label: "PnL", align: "text-right" },
  ];

  return (
    <main className="bg-warroom min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="eyebrow">The record</p>
        <h1 className="display mt-3 text-4xl">Trade log</h1>
        <p className="mt-3 max-w-2xl text-mute">
          Every decision the agent has ever made, served from{" "}
          <span className="mono text-amber">data/trades.json</span>. Click a row
          for the full skill breakdown. Sort by any column.
        </p>

        <div className="panel mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggle(c.key)}
                      className={`mono cursor-pointer select-none px-4 py-3 text-[11px] uppercase tracking-wider text-faint hover:text-amber ${c.align ?? "text-left"}`}
                    >
                      {c.label}
                      {sort === c.key && <span className="ml-1 text-amber">{dir === 1 ? "▲" : "▼"}</span>}
                    </th>
                  ))}
                  <th className="mono px-4 py-3 text-left text-[11px] uppercase tracking-wider text-faint">
                    Rationale
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const open = expanded === t.id;
                  const rm = REGIME_META[t.regime];
                  const dm = DIRECTION_META[t.direction];
                  return (
                    <Fragment key={t.id}>
                      <tr
                        onClick={() => setExpanded(open ? null : t.id)}
                        className="cursor-pointer border-b border-line transition-colors hover:bg-panel"
                      >
                        <td className="mono whitespace-nowrap px-4 py-3 text-xs text-faint">
                          {fmtTime(t.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-display text-base text-cream">
                          {ASSET_LABEL[t.asset]}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`mono text-xs uppercase tracking-wider ${toneText(rm.tone)}`}>
                            {rm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={tagClass(dm.tone)}>{dm.label}</span>
                        </td>
                        <td className="mono px-4 py-3 text-right text-mute">
                          {(t.conviction * 100).toFixed(0)}%
                        </td>
                        <td className={`mono px-4 py-3 text-right ${t.status === "closed" ? pnlColor(t.pnlPct) : "text-faint"}`}>
                          {t.status === "closed" ? fmtPct(t.pnlPct) : t.status}
                        </td>
                        <td className="max-w-[300px] truncate px-4 py-3 text-mute">
                          {t.rationale}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-line bg-oxblood-2">
                          <td colSpan={7} className="px-4 py-5">
                            <Detail t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-faint">
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
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="eyebrow">
          Skill signals → weighted vote {t.weightedScore.toFixed(2)}
        </p>
        <div className="mt-4 space-y-2">
          {t.signals.map((s) => (
            <div key={s.skill} className="mono flex items-center gap-3 text-[11px]">
              <span className="w-32 shrink-0 text-mute">@{s.skill}</span>
              <div className="relative h-[3px] flex-1 bg-line">
                <div
                  className="absolute top-0 h-full"
                  style={{
                    background: s.score >= 0 ? "#d4a05c" : "#c4633a",
                    left: "50%",
                    width: `${(Math.abs(s.score) / 2) * 100}%`,
                    transform: s.score >= 0 ? "none" : "translateX(-100%)",
                  }}
                />
                <div className="absolute left-1/2 top-[-3px] h-[9px] w-px bg-line-strong" />
              </div>
              <span className={`w-12 shrink-0 text-right ${s.score >= 0 ? "text-amber" : "text-rust"}`}>
                {s.score >= 0 ? "+" : ""}
                {s.score.toFixed(2)}
              </span>
              <span className="w-14 shrink-0 text-right text-faint">
                w {(t.weights[s.skill] ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <Field k="Strategy" v={t.strategy} />
          <Field k="Entry" v={fmtPrice(t.entryPrice)} />
          <Field k="Exit" v={t.exitPrice ? fmtPrice(t.exitPrice) : "—"} />
          <Field k="Status" v={t.status} />
          <Field k="Perception" v={t.source} />
          <Field k="Rationale by" v={t.rationaleSource} />
        </div>
        <p className="flex gap-2 text-sm leading-relaxed text-mute">
          <span className="mono shrink-0 text-amber">›</span>
          <span>{t.rationale}</span>
        </p>
        <div className="mono text-[10px] text-faint">id {t.id}</div>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-oxblood px-3 py-2.5">
      <div className="eyebrow">{k}</div>
      <div className="mono mt-1 text-sm text-cream">{v}</div>
    </div>
  );
}
