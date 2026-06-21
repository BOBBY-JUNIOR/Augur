"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SKILL_META } from "@/lib/ui";
import { SKILLS, type WeightSnapshot } from "@/lib/types";

export const axisTick = {
  fill: "#7a6c66",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
};

export const tooltipStyle = {
  background: "#150b0b",
  border: "1px solid rgba(168,152,144,0.28)",
  borderRadius: 2,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "#f0e8e0",
  boxShadow: "none",
};

export function WeightChart({ history }: { history: WeightSnapshot[] }) {
  const data = history.map((h, i) => ({
    idx: i + 1,
    ...Object.fromEntries(
      SKILLS.map((s) => [s, +(h.weights[s] * 100).toFixed(2)])
    ),
  }));

  if (data.length === 0) {
    return <Empty msg="No weight history yet — run a few cycles to watch the committee re-weight." />;
  }

  return (
    <ResponsiveContainer width="100%" height={248}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <XAxis
          dataKey="idx"
          tick={axisTick}
          axisLine={{ stroke: "rgba(168,152,144,0.15)" }}
          tickLine={false}
        />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          unit="%"
          domain={[0, 50]}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: "rgba(168,152,144,0.2)" }}
          formatter={(v: number, k: string) => [
            `${v}%`,
            SKILL_META[k as keyof typeof SKILL_META]?.label ?? k,
          ]}
          labelFormatter={(l) => `UPDATE ${l}`}
        />
        {SKILLS.map((s) => (
          <Line
            key={s}
            type="monotone"
            dataKey={s}
            stroke={SKILL_META[s].color}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-[248px] items-center justify-center px-6 text-center text-sm text-faint">
      {msg}
    </div>
  );
}
