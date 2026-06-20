"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TradeRecord } from "@/lib/types";
import { Empty, tooltipStyle } from "./WeightChart";

export function PnlChart({ trades }: { trades: TradeRecord[] }) {
  const closed = trades
    .filter((t) => t.status === "closed" && t.pnlPct != null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  let cum = 0;
  const data = closed.map((t, i) => {
    cum += (t.pnlPct ?? 0) * 100;
    return { idx: i + 1, cum: +cum.toFixed(3), asset: t.asset };
  });

  if (data.length === 0) {
    return <Empty msg="No closed trades yet — cumulative PnL appears once positions close." />;
  }

  const last = data[data.length - 1].cum;
  const positive = last >= 0;
  const color = positive ? "#34d399" : "#fb7185";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="idx"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v}%`, "Cumulative PnL"]}
          labelFormatter={(l) => `Closed trade #${l}`}
        />
        <Area
          type="monotone"
          dataKey="cum"
          stroke={color}
          strokeWidth={2}
          fill="url(#pnlFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
