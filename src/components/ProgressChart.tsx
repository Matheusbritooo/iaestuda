"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

type DataPoint = { day: string; minutos: number; meta: number };

export default function ProgressChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [`${value} min`, "Estudado"]}
          contentStyle={{ background: "oklch(0.16 0.025 248)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: 12, color: "white" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <ReferenceLine y={data[0]?.meta ?? 120} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
        <Bar dataKey="minutos" fill="oklch(0.88 0.20 163)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
