"use client";

import { motion } from "framer-motion";
import type { RepoAnalytics } from "@/orchestrator/types";

const SIGNALS: [keyof RepoAnalytics["signals"], string][] = [
  ["readme", "README"],
  ["license", "License"],
  ["tests", "Tests"],
  ["ci", "CI"],
  ["docs", "Docs"],
  ["contributing", "Contributing"],
];

function scoreColor(score: number) {
  return score >= 70 ? "var(--color-done)" : score >= 40 ? "var(--color-working)" : "var(--color-error)";
}

/** Animated donut gauge for the composite health score. */
function HealthDonut({ score }: { score: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface)" strokeWidth="10" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight">{score}</div>
          <div className="text-[9px] uppercase tracking-wider text-[var(--color-faint)]">/ 100</div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal bar rows that fill on entry. */
function Bars({ data, color = "var(--color-wine)" }: { data: { label: string; value: number; note: string }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium">{d.label}</span>
            <span className="font-mono text-[10px] text-[var(--color-faint)]">{d.note}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <motion.div
              className="h-full rounded-full" style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.06 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsDashboard({ analytics: a }: { analytics: RepoAnalytics }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {/* Health + stats */}
      <div className="card flex items-center gap-5 p-5">
        <HealthDonut score={a.healthScore} />
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
          {[
            ["Files", a.totalFiles.toLocaleString(), "#78dce8"],
            ["Depth", String(a.maxDepth), "#ab9df2"],
            ["Dependencies", a.dependencyCount?.toString() ?? "—", "#fc9867"],
            ["Onboarding", a.onboardingDifficulty, "#ffd866"],
          ].map(([label, value, color]) => (
            <div key={label}>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-faint)]">{label}</div>
              <div className="text-lg font-semibold capitalize tracking-tight" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hygiene signals */}
      <div className="card p-5">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
          Hygiene signals
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {SIGNALS.map(([key, label]) => {
            const on = a.signals[key];
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className={on ? "" : "text-[var(--color-faint)]"}>{label}</span>
                <span
                  className="grid h-4 w-4 place-items-center rounded-full text-[9px] text-white"
                  style={{ background: on ? "var(--color-done)" : "var(--color-hairline-strong)" }}
                >
                  {on ? "✓" : "–"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="card p-5">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
          Language composition
        </div>
        <Bars
          color="#78dce8"
          data={a.languages.slice(0, 5).map((l) => ({
            label: l.name,
            value: l.files,
            note: `${l.pct}%`,
          }))}
        />
      </div>

      {/* Top directories */}
      <div className="card p-5">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
          Where the code lives
        </div>
        <Bars
          color="#ab9df2"
          data={a.topDirs.map((d) => ({
            label: `${d.name}/`,
            value: d.files,
            note: `${d.files} files`,
          }))}
        />
      </div>
    </section>
  );
}
