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

/** Four palette hues, all legible on paper. */
const INK_BLUE = "#2f5468";
const OCHRE = "#a5722a";
const MOSS = "#4e7b4a";
const OXIDE = "#b4432e";

function scoreColor(score: number) {
  return score >= 70 ? "var(--color-done)" : score >= 40 ? "var(--color-working)" : "var(--color-error)";
}

function TileLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-faint)]">
      {children}
    </div>
  );
}

/** Animated donut gauge for the composite health score. */
function HealthDonut({ score }: { score: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-serif text-3xl tracking-tight">{score}</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-faint)]">/ 100</div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal bar rows that fill on entry. */
function Bars({ data, color }: { data: { label: string; value: number; note: string }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium">{d.label}</span>
            <span className="font-mono text-[10px] text-[var(--color-faint)]">{d.note}</span>
          </div>
          <div className="glass-well h-1.5 overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
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

/** Bento board: each reading of the repository gets its own tile. */
export function AnalyticsDashboard({ analytics: a }: { analytics: RepoAnalytics }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <div className="card flex flex-col items-center justify-center gap-2 p-5">
        <HealthDonut score={a.healthScore} />
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-faint)]">
          Health score
        </div>
      </div>

      <div className="card p-5 md:col-span-2">
        <TileLabel>At a glance</TileLabel>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          {[
            ["Files", a.totalFiles.toLocaleString(), INK_BLUE],
            ["Depth", String(a.maxDepth), OCHRE],
            ["Dependencies", a.dependencyCount?.toString() ?? "—", MOSS],
            ["Onboarding", a.onboardingDifficulty, OXIDE],
          ].map(([label, value, color]) => (
            <div key={label}>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">{label}</div>
              <div className="font-serif text-2xl capitalize tracking-tight" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 md:col-span-2">
        <TileLabel>Language composition</TileLabel>
        <Bars
          color={INK_BLUE}
          data={a.languages.slice(0, 5).map((l) => ({ label: l.name, value: l.files, note: `${l.pct}%` }))}
        />
      </div>

      <div className="card p-5">
        <TileLabel>Hygiene signals</TileLabel>
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

      <div className="card p-5 md:col-span-3">
        <TileLabel>Where the code lives</TileLabel>
        <Bars
          color={OCHRE}
          data={a.topDirs.map((d) => ({ label: `${d.name}/`, value: d.files, note: `${d.files} files` }))}
        />
      </div>
    </section>
  );
}
