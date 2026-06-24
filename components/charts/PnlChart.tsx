"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TradeRecord } from "@/lib/types";
import { Empty, axisTick, tooltipStyle } from "./WeightChart";

export function PnlChart({ trades }: { trades: TradeRecord[] }) {
  const closed = trades
    .filter((t) => t.status === "closed" && t.pnlPct != null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  let cum = 0;
  const data = closed.map((t, i) => {
    cum += (t.pnlPct ?? 0) * 100;
    return { idx: i + 1, cum: +cum.toFixed(3) };
  });

  if (data.length === 0) {
    return <Empty msg="No closed trades yet — cumulative PnL appears once positions close." />;
  }

  const last = data[data.length - 1].cum;
  const color = last >= 0 ? "#34d399" : "#f43f5e";

  return (
    <ResponsiveContainer width="100%" height={248}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="idx"
          tick={axisTick}
          axisLine={{ stroke: "rgba(139,148,158,0.15)" }}
          tickLine={false}
        />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="%" />
        <ReferenceLine y={0} stroke="rgba(139,148,158,0.25)" strokeDasharray="2 3" />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: "rgba(139,148,158,0.2)" }}
          formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v}%`, "Cumulative PnL"]}
          labelFormatter={(l) => `CLOSE ${l}`}
        />
        <Area
          type="monotone"
          dataKey="cum"
          stroke={color}
          strokeWidth={1.6}
          fill="url(#pnlFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
