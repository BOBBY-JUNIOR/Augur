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

export function WeightChart({ history }: { history: WeightSnapshot[] }) {
  const data = history.map((h, i) => ({
    idx: i + 1,
    ...Object.fromEntries(
      SKILLS.map((s) => [s, +(h.weights[s] * 100).toFixed(2)])
    ),
  }));

  if (data.length === 0) {
    return (
      <Empty msg="No weight history yet — run a few cycles to watch the committee re-weight." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
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
          domain={[0, 50]}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, k: string) => [
            `${v}%`,
            SKILL_META[k as keyof typeof SKILL_META]?.label ?? k,
          ]}
          labelFormatter={(l) => `Update #${l}`}
        />
        {SKILLS.map((s) => (
          <Line
            key={s}
            type="monotone"
            dataKey={s}
            stroke={SKILL_META[s].color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export const tooltipStyle = {
  background: "rgba(10,10,10,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#e5e7eb",
};

export function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center px-6 text-center text-sm text-gray-500">
      {msg}
    </div>
  );
}
