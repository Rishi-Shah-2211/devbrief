"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS, WORKERS } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName } from "@/orchestrator/types";

/**
 * Quad-view mission stage. The run is watched four ways at once — a mercury
 * pool that merges as agents land, a tomographic scan of the repository, an
 * orbital telemetry ring, and a star chart that draws itself. Every position
 * is a constant; nothing is measured, so nothing can flicker.
 */
const STAGE_LINE = "rgba(241,237,227,0.09)";
const DIM = "#3a352b";

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

const SATELLITES = [...WORKERS.map((w) => w.name), "critic"] as AgentName[];

function useElapsed(stopped: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [stopped]);
  return elapsed;
}

function Panel({
  mark,
  title,
  stat,
  children,
}: {
  mark: string;
  title: string;
  stat: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[46vh] overflow-hidden">
      {children}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span style={{ color: "rgba(241,237,227,0.42)" }}>
          <span style={{ color: "rgba(241,237,227,0.24)" }}>{mark} · </span>
          {title}
        </span>
        <span style={{ color: "rgba(241,237,227,0.28)" }}>{stat}</span>
      </div>
    </div>
  );
}

/* ── 01 · Mercury pool ─────────────────────────────────────────────
   Each agent is a droplet. When it lands, it flows in and merges. */
const HOME: Record<string, { x: number; y: number }> = {
  architect: { x: 58, y: 52 },
  dependency: { x: 242, y: 46 },
  docs: { x: 46, y: 150 },
  startHere: { x: 150, y: 174 },
  critic: { x: 252, y: 146 },
};

function MercuryPool({ agents, doneCount }: Props & { doneCount: number }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <filter id="db-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
        </filter>
      </defs>
      <g filter="url(#db-goo)">
        <motion.circle
          cx={150}
          cy={100}
          fill="#c8c3b6"
          animate={{ r: 15 + doneCount * 2.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        {SATELLITES.map((name) => {
          const meta = AGENTS.find((a) => a.name === name);
          const st = agents[name]?.status ?? "idle";
          const merged = st === "done";
          const home = HOME[name];
          return (
            <motion.circle
              key={name}
              fill={st === "idle" ? "#5c564a" : merged ? "#c8c3b6" : (meta?.color ?? "#c8c3b6")}
              initial={{ cx: home.x, cy: home.y, r: 9 }}
              animate={{
                cx: merged ? 150 : home.x,
                cy: merged ? 100 : home.y,
                r: st === "working" ? 13 : merged ? 12 : 9,
              }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </g>
      <circle cx={150} cy={100} r={4} fill="#f4f1e8" />
      {SATELLITES.map((name) => {
        const st = agents[name]?.status ?? "idle";
        if (st === "done") return null;
        const home = HOME[name];
        return (
          <text
            key={name}
            x={home.x}
            y={home.y + 26}
            textAnchor="middle"
            fontFamily="var(--font-mono), monospace"
            fontSize="8"
            fill={st === "idle" ? "rgba(241,237,227,0.22)" : "rgba(241,237,227,0.55)"}
          >
            {name.toLowerCase()}
          </text>
        );
      })}
    </svg>
  );
}

/* ── 02 · Tomography ───────────────────────────────────────────────
   The repository as strata under a scanner. */
const BANDS = [
  [26, 178], [18, 244], [42, 122], [38, 198], [56, 90], [54, 152],
  [40, 214], [24, 140], [44, 186], [22, 108], [50, 168], [30, 196],
] as const;

function Tomography({ activeColor, layer }: { activeColor: string; layer: number }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <g fill="#241f18">
        {BANDS.map(([x, w], i) => (
          <rect key={i} x={x} y={22 + i * 13} width={w} height={6} rx={3} />
        ))}
      </g>
      <motion.g
        animate={{ y: [0, 150, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x={0} y={8} width={300} height={26} fill={activeColor} opacity={0.09} />
        <rect x={0} y={33} width={300} height={1.4} fill={activeColor} />
        <circle cx={10} cy={33.7} r={2.6} fill={activeColor} />
        <circle cx={290} cy={33.7} r={2.6} fill={activeColor} />
      </motion.g>
      <text x={16} y={190} fontFamily="var(--font-mono), monospace" fontSize="8.5" fill="rgba(241,237,227,0.35)">
        layer {String(layer).padStart(2, "0")} / 12 · resolving structure
      </text>
    </svg>
  );
}

/* ── 03 · Orbital telemetry ────────────────────────────────────────
   Agents ride tilted orbits around the repository core. */
const ORBITS: { tilt: number; r: number; squash: number; dur: number; members: AgentName[] }[] = [
  { tilt: -18, r: 96, squash: 0.4, dur: 16, members: ["architect", "dependency"] },
  { tilt: 26, r: 70, squash: 0.5, dur: 11, members: ["docs", "startHere"] },
  { tilt: -54, r: 46, squash: 0.36, dur: 7.5, members: ["critic", "synthesizer"] },
];

function Orbital({ agents, anyWorking }: Props & { anyWorking: boolean }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {ORBITS.map((o) => (
        <g
          key={o.tilt}
          transform={`rotate(${o.tilt} 150 100) translate(150 100) scale(1 ${o.squash}) translate(-150 -100)`}
        >
          <circle cx={150} cy={100} r={o.r} fill="none" stroke={DIM} strokeWidth={1} />
          {o.members.map((name, j) => {
            const meta = AGENTS.find((a) => a.name === name);
            const st = agents[name]?.status ?? "idle";
            return (
              <motion.g
                key={name}
                style={{ transformOrigin: "150px 100px", transformBox: "view-box" }}
                animate={{ rotate: 360 }}
                transition={{ duration: st === "working" ? o.dur * 0.55 : o.dur, repeat: Infinity, ease: "linear" }}
              >
                <g transform={`rotate(${j * 180} 150 100)`}>
                  <circle
                    cx={150 + o.r}
                    cy={100}
                    r={st === "working" ? 6 : 4.5}
                    fill={st === "idle" ? "#4a443a" : (meta?.color ?? "#c8c3b6")}
                  />
                </g>
              </motion.g>
            );
          })}
        </g>
      ))}
      <circle cx={150} cy={100} r={12} fill="#100e0a" stroke="rgba(241,237,227,0.3)" />
      <motion.circle
        cx={150}
        cy={100}
        fill="none"
        stroke="rgba(241,237,227,0.35)"
        animate={{ r: [13, 42], opacity: [0.5, 0] }}
        transition={{ duration: anyWorking ? 2.6 : 4.4, repeat: Infinity, ease: "easeOut" }}
      />
      <text x={150} y={104} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="8" fill="rgba(241,237,227,0.5)">
        core
      </text>
    </svg>
  );
}

/* ── 04 · Star chart ───────────────────────────────────────────────
   A star per agent; the constellation draws itself as findings land. */
const STARS: { name: AgentName; x: number; y: number }[] = [
  { name: "architect", x: 58, y: 138 },
  { name: "docs", x: 100, y: 66 },
  { name: "dependency", x: 156, y: 108 },
  { name: "startHere", x: 202, y: 44 },
  { name: "critic", x: 142, y: 166 },
  { name: "synthesizer", x: 250, y: 92 },
];
const FIELD = [
  [30, 52], [86, 178], [216, 150], [272, 32], [122, 26], [180, 184], [40, 96], [258, 174],
] as const;

function StarChart({ agents, doneCount }: Props & { doneCount: number }) {
  const points = STARS.map((s) => `${s.x},${s.y}`).join(" ");
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <g fill="#4a4438">
        {FIELD.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.3} />
        ))}
      </g>
      <motion.polyline
        points={points}
        fill="none"
        stroke="#c8c3b6"
        strokeWidth={1}
        opacity={0.55}
        pathLength={1}
        strokeDasharray={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - doneCount / STARS.length }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      {STARS.map((s) => {
        const meta = AGENTS.find((a) => a.name === s.name);
        const st = agents[s.name]?.status ?? "idle";
        const lit = st === "done" || st === "working";
        return (
          <motion.circle
            key={s.name}
            cx={s.x}
            cy={s.y}
            fill={st === "idle" ? "#5c564a" : (meta?.color ?? "#f0e8d6")}
            animate={
              st === "working"
                ? { r: [3.5, 6, 3.5], opacity: [0.7, 1, 0.7] }
                : { r: lit ? 4.5 : 2.6, opacity: lit ? 1 : 0.35 }
            }
            transition={st === "working" ? { duration: 1.4, repeat: Infinity } : { duration: 0.6 }}
          />
        );
      })}
      <text x={16} y={190} fontFamily="var(--font-mono), monospace" fontSize="8.5" fill="rgba(241,237,227,0.35)">
        {doneCount} of {STARS.length} charted
      </text>
    </svg>
  );
}

export function AgentCanvas({ agents }: Props) {
  const anyWorking = Object.values(agents).some((a) => a?.status === "working");
  const doneCount = Object.values(agents).filter((a) => a?.status === "done").length;
  const finished = agents.synthesizer?.status === "done" || agents.synthesizer?.status === "error";
  const elapsed = useElapsed(finished);
  const tokens = Object.values(agents).reduce((sum, a) => sum + (a?.tokensUsed ?? 0), 0);

  const focusName = (["synthesizer", "critic", ...WORKERS.map((w) => w.name)] as AgentName[]).find(
    (n) => agents[n]?.status === "working",
  );
  const focusMeta = focusName ? AGENTS.find((a) => a.name === focusName) : undefined;
  const focusLine = focusName ? agents[focusName]?.preview ?? agents[focusName]?.detail : undefined;
  const accent = focusMeta?.color ?? "#c8c3b6";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl"
      style={{
        background: "radial-gradient(120% 100% at 50% 35%, #14110b 0%, #0a0806 55%, #050403 100%)",
        boxShadow: "inset 0 1px 0 rgba(241,237,227,0.07)",
      }}
    >
      {/* Mission bar */}
      <div className="relative z-30 px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-fit items-center gap-6 rounded-full border px-5 py-2 font-mono text-[11px]"
          style={{
            borderColor: "rgba(241,237,227,0.16)",
            background: "rgba(20,17,11,0.5)",
            color: "rgba(241,237,227,0.72)",
            backdropFilter: "blur(20px) saturate(1.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
              animate={finished ? {} : { opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {finished ? "RUN COMPLETE" : "ALL STATIONS LIVE"}
          </span>
          <span>
            T+{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
          <span>{tokens.toLocaleString()} tok</span>
          <span>{doneCount}/6 agents</span>
        </motion.div>
      </div>

      {/* Four simultaneous readings of the same run */}
      <div
        className="relative grid flex-1 grid-cols-1 sm:grid-cols-2"
        style={{ borderTop: `1px solid ${STAGE_LINE}` }}
      >
        <div style={{ borderRight: `1px solid ${STAGE_LINE}`, borderBottom: `1px solid ${STAGE_LINE}` }}>
          <Panel mark="01" title="mercury pool" stat={`${doneCount} merged`}>
            <MercuryPool agents={agents} doneCount={doneCount} />
          </Panel>
        </div>
        <div style={{ borderBottom: `1px solid ${STAGE_LINE}` }}>
          <Panel mark="02" title="tomography" stat={anyWorking ? "scanning" : "idle"}>
            <Tomography activeColor={accent} layer={Math.min(12, doneCount * 2 + 1)} />
          </Panel>
        </div>
        <div style={{ borderRight: `1px solid ${STAGE_LINE}` }}>
          <Panel mark="03" title="orbital telemetry" stat={`${ORBITS.length} rings`}>
            <Orbital agents={agents} anyWorking={anyWorking} />
          </Panel>
        </div>
        <div>
          <Panel mark="04" title="star chart" stat={`${doneCount}/6 charted`}>
            <StarChart agents={agents} doneCount={doneCount} />
          </Panel>
        </div>

        {/* Centre HUD — sits on the crosshair where all four panels meet. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(26rem,78vw)] -translate-x-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            <motion.div
              key={focusName ?? "idle"}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border px-5 py-4 font-mono text-[11px]"
              style={{
                borderColor: `${accent}55`,
                background: "rgba(10,8,6,0.55)",
                backdropFilter: "blur(24px) saturate(1.5)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px ${accent}18`,
              }}
            >
              <div
                className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                  animate={focusLine ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                {focusMeta ? `live · ${focusMeta.label.toLowerCase()}` : "all stations nominal"}
              </div>
              <p className="line-clamp-3 break-words leading-relaxed" style={{ color: "rgba(241,237,227,0.8)" }}>
                {focusLine ?? (anyWorking ? "receiving…" : "assembling the brief")}
                <motion.span
                  className="ml-1 inline-block h-[10px] w-[5px] translate-y-[1px]"
                  style={{ background: accent }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
