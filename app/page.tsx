"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

type RangeKey = "Tag" | "Woche" | "Monat" | "Jahr";

const CHART_DATA: Record<RangeKey, { time: string; value: number }[]> = {
  Tag: [
    { time: "00:00", value: 120 },
    { time: "03:00", value: 128 },
    { time: "06:00", value: 132 },
    { time: "09:00", value: 142 },
    { time: "12:00", value: 156 },
    { time: "15:00", value: 168 },
    { time: "18:00", value: 180 },
    { time: "21:00", value: 192 },
  ],
  Woche: [
    { time: "Mo", value: 148 },
    { time: "Di", value: 152 },
    { time: "Mi", value: 160 },
    { time: "Do", value: 158 },
    { time: "Fr", value: 168 },
    { time: "Sa", value: 172 },
    { time: "So", value: 178 },
  ],
  Monat: [
    { time: "W1", value: 132 },
    { time: "W2", value: 148 },
    { time: "W3", value: 160 },
    { time: "W4", value: 176 },
  ],
  Jahr: [
    { time: "Jan", value: 110 },
    { time: "Mär", value: 128 },
    { time: "Mai", value: 145 },
    { time: "Jul", value: 168 },
    { time: "Sep", value: 182 },
    { time: "Nov", value: 198 },
  ],
};

const WEAR_BOUNDARIES = [0.07, 0.15, 0.38, 0.45];

const TOP_PERFORMER = [
  { name: "AK-47 | Fire Serpent", wear: "Fabrikneu", change: "+34%", floatValue: 0.03 },
  { name: "AWP | Dragon Lore", wear: "Minimale Gebrauchsspuren", change: "+28%", floatValue: 0.11 },
  { name: "M4A4 | Howl", wear: "Fabrikneu", change: "+21%", floatValue: 0.05 },
];

const NEEDS_ATTENTION = [
  { name: "Glock-18 | Fade", wear: "Fabrikneu", change: "-12%", floatValue: 0.06 },
  { name: "Desert Eagle | Blaze", wear: "Fabrikneu", change: "-8%", floatValue: 0.07 },
  { name: "AK-47 | Vulcan", wear: "Minimale Gebrauchsspuren", change: "-6%", floatValue: 0.14 },
];

function WearBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const percent = clamped * 100;

  return (
    <div className="mt-2">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.35) 45%, rgba(99,102,241,0.75) 100%)",
          }}
        />
        {WEAR_BOUNDARIES.map((boundary) => (
          <span
            key={boundary}
            className="absolute top-0 bottom-0 w-px bg-white/70"
            style={{ right: `${boundary * 100}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-gray-900 shadow"
          style={{ right: `calc(${percent}% - 6px)` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("Tag");
  const data = useMemo(() => CHART_DATA[range], [range]);

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-8">
      <section>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Willkommen zurück, Investor 👋
        </h2>
        <p className="mt-2 text-secondary">Hier ist dein CS2 Inventar Portfolio heute</p>
      </section>

      <section className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-semibold">86.000€</span>
              <span className="text-emerald-600 font-semibold">+34%</span>
            </div>
            <p className="mt-2 text-sm font-medium text-secondary">Steam Inventarwert</p>
          </div>

          <div className="flex items-center gap-2 rounded-[24px] bg-gray-100 p-1">
            {(["Tag", "Woche", "Monat", "Jahr"] as RangeKey[]).map((key) => {
              const active = key === range;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={[
                    "px-4 py-1.5 text-sm font-medium rounded-[24px] transition",
                    active ? "bg-white shadow-card text-foreground" : "text-secondary hover:text-foreground",
                  ].join(" ")}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#valueGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Top Performer</h3>
              <p className="text-sm text-secondary">Beste Skins in diesem Zeitraum</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {TOP_PERFORMER.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>{item.name}</span>
                    <span className="text-emerald-600">{item.change}</span>
                  </div>
                  <div className="text-xs text-muted">{item.wear}</div>
                  <WearBar value={item.floatValue} />
                  <div className="mt-1 text-xs text-muted">{item.floatValue.toFixed(2)} Float</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Benötigt Aufmerksamkeit</h3>
              <p className="text-sm text-secondary">Skins mit negativer Performance</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {NEEDS_ATTENTION.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <TrendingDown size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>{item.name}</span>
                    <span className="text-rose-600">{item.change}</span>
                  </div>
                  <div className="text-xs text-muted">{item.wear}</div>
                  <WearBar value={item.floatValue} />
                  <div className="mt-1 text-xs text-muted">{item.floatValue.toFixed(2)} Float</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
