"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { AGENTS, WORKERS } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName } from "@/orchestrator/types";

/**
 * Quad-view mission stage — a concave wall of four screens, each reading the
 * same run a different way. The wall tilts with the pointer, attention cycles
 * from screen to screen, and every panel keeps moving whether or not an agent
 * is currently reporting. Every coordinate is a constant, so nothing flickers.
 */
const STAGE_LINE = "rgba(241,237,227,0.09)";
const BONE = "#cfcabc";

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

const SATELLITES = [...WORKERS.map((w) => w.name), "critic"] as AgentName[];

const HOME: Record<string, { x: number; y: number }> = {
  architect: { x: 58, y: 52 },
  dependency: { x: 242, y: 46 },
  docs: { x: 46, y: 150 },
  startHere: { x: 150, y: 174 },
  critic: { x: 252, y: 146 },
};

const BANDS = [
  [26, 178], [18, 244], [42, 122], [38, 198], [56, 90], [54, 152],
  [40, 214], [24, 140], [44, 186], [22, 108], [50, 168], [30, 196],
] as const;

const ORBITS: { tilt: number; r: number; squash: number; dur: number; members: AgentName[] }[] = [
  { tilt: -18, r: 96, squash: 0.4, dur: 16, members: ["architect", "dependency"] },
  { tilt: 26, r: 70, squash: 0.5, dur: 11, members: ["docs", "startHere"] },
  { tilt: -54, r: 46, squash: 0.36, dur: 7.5, members: ["critic", "synthesizer"] },
];

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
  [64, 20], [232, 118], [12, 160], [196, 148],
] as const;

/* ── Chrome ──────────────────────────────────────────────────────── */

function MissionBar({ agents, accent }: Props & { accent: string }) {
  const [elapsed, setElapsed] = useState(0);
  const finished = agents.synthesizer?.status === "done" || agents.synthesizer?.status === "error";

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const tokens = Object.values(agents).reduce((sum, a) => sum + (a?.tokensUsed ?? 0), 0);
  const done = Object.values(agents).filter((a) => a?.status === "done").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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
      <span>{done}/6 agents</span>
    </motion.div>
  );
}

/** A telemetry line that never stops moving, isolated so it re-renders alone. */
function Readout({ x, y, color }: { x: number; y: number; color: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => v + 1), 320);
    return () => clearInterval(t);
  }, []);
  const hex = (0x4f2a71 + n * 7333).toString(16).slice(-6);
  return (
    <text x={x} y={y} fontFamily="var(--font-mono), monospace" fontSize="8" fill={color}>
      0x{hex} · {String((n * 37) % 960).padStart(3, "0")} kb/s
    </text>
  );
}

const CORNER = {
  tl: { ry: 7, rx: 4, origin: "100% 100%" },
  tr: { ry: -7, rx: 4, origin: "0% 100%" },
  bl: { ry: 7, rx: -4, origin: "100% 0%" },
  br: { ry: -7, rx: -4, origin: "0% 0%" },
} as const;

function Panel({
  mark,
  title,
  stat,
  corner,
  focused,
  focusTick,
  accent,
  slow,
  fast,
  children,
}: {
  mark: string;
  title: string;
  stat: string;
  corner: keyof typeof CORNER;
  focused: boolean;
  focusTick: number;
  accent: string;
  slow: { x: MotionValue<number>; y: MotionValue<number> };
  fast: { x: MotionValue<number>; y: MotionValue<number> };
  children: React.ReactNode;
}) {
  const c = CORNER[corner];
  return (
    <motion.div
      className="relative min-h-[46vh] overflow-hidden"
      style={{ transformOrigin: c.origin, zIndex: focused ? 10 : 1 }}
      animate={{
        rotateY: focused ? c.ry * 0.25 : c.ry,
        rotateX: focused ? c.rx * 0.25 : c.rx,
        z: focused ? 74 : 0,
        scale: focused ? 1.025 : 1,
        filter: focused ? "brightness(1.12)" : "brightness(0.82)",
      }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Far layer: dot grid + corner wash, drifts least. */}
      <motion.div
        className="pointer-events-none absolute -inset-8"
        style={{
          x: slow.x,
          y: slow.y,
          backgroundImage: "radial-gradient(rgba(241,237,227,0.055) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-8"
        style={{
          x: slow.x,
          y: slow.y,
          background: `radial-gradient(70% 60% at 50% 45%, ${accent}14, transparent 70%)`,
        }}
      />

      {/* Mid layer: the visualisation itself. */}
      <motion.div className="absolute inset-0" style={{ x: fast.x, y: fast.y }}>
        {children}
      </motion.div>

      {/* Near layer: labels and brackets, drift most. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: useTransform(fast.x, (v) => v * 1.7), y: useTransform(fast.y, (v) => v * 1.7) }}
      >
        <div className="absolute inset-x-0 top-0 flex items-baseline justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span style={{ color: focused ? accent : "rgba(241,237,227,0.42)" }}>
            <span style={{ color: "rgba(241,237,227,0.24)" }}>{mark} · </span>
            {title}
          </span>
          <span style={{ color: "rgba(241,237,227,0.3)" }}>{focused ? "refreshing" : stat}</span>
        </div>
        {(["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"] as const).map((p, i) => (
          <motion.span
            key={p}
            className={`absolute ${p} h-3 w-3`}
            style={{
              borderTop: i < 2 ? `1px solid ${focused ? accent : STAGE_LINE}` : undefined,
              borderBottom: i >= 2 ? `1px solid ${focused ? accent : STAGE_LINE}` : undefined,
              borderLeft: i % 2 === 0 ? `1px solid ${focused ? accent : STAGE_LINE}` : undefined,
              borderRight: i % 2 === 1 ? `1px solid ${focused ? accent : STAGE_LINE}` : undefined,
            }}
          />
        ))}
      </motion.div>

      {/* The screen refreshing: a beam runs the panel each time focus lands. */}
      <AnimatePresence>
        {focused ? (
          <motion.div
            key={focusTick}
            className="pointer-events-none absolute inset-x-0 h-px"
            style={{ background: accent, boxShadow: `0 0 26px 3px ${accent}` }}
            initial={{ top: "-2%", opacity: 0 }}
            animate={{ top: "102%", opacity: [0, 0.85, 0.85, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeInOut" }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── 01 · Mercury pool ───────────────────────────────────────────── */

function MercuryPool({ agents, doneCount }: Props & { doneCount: number }) {
  const core = 15 + doneCount * 2.2;
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <filter id="db-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
        </filter>
      </defs>

      {/* Surface caustics — the pool is never still. */}
      {[34, 54, 76].map((r, i) => (
        <motion.circle
          key={r}
          cx={150}
          cy={100}
          fill="none"
          stroke="rgba(207,202,188,0.09)"
          animate={{ r: [r, r + 7, r], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 6 + i * 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}

      <g filter="url(#db-goo)">
        <motion.circle
          cx={150}
          cy={100}
          fill={BONE}
          animate={{ r: [core, core + 2.8, core] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`bead-${i}`}
            fill={BONE}
            animate={{
              cx: [150 + 9, 150, 150 - 9, 150, 150 + 9],
              cy: [100, 100 + 9, 100, 100 - 9, 100],
              r: [5, 7, 5, 6, 5],
            }}
            transition={{ duration: 4.5 + i, repeat: Infinity, ease: "linear", delay: i * 1.1 }}
          />
        ))}

        {SATELLITES.map((name, i) => {
          const meta = AGENTS.find((a) => a.name === name);
          const st = agents[name]?.status ?? "idle";
          const merged = st === "done";
          const h = HOME[name];
          const cx0 = merged ? 150 : h.x;
          const cy0 = merged ? 100 : h.y;
          const w = merged ? 5 : st === "working" ? 11 : 7;
          return (
            <motion.circle
              key={name}
              fill={st === "idle" ? "#605a4d" : merged ? BONE : (meta?.color ?? BONE)}
              animate={{
                cx: [cx0 + w, cx0, cx0 - w, cx0, cx0 + w],
                cy: [cy0, cy0 + w, cy0, cy0 - w, cy0],
                r: st === "working" ? [12, 14.5, 12] : merged ? [11, 12.5, 11] : [8.5, 9.8, 8.5],
              }}
              transition={{
                duration: st === "working" ? 3.4 : 6.5 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          );
        })}

        {/* Tribute: droplets peel off and run to the pool, always. */}
        {SATELLITES.flatMap((name, i) => {
          const st = agents[name]?.status ?? "idle";
          if (st === "done") return [];
          const meta = AGENTS.find((a) => a.name === name);
          const h = HOME[name];
          const busy = st === "working";
          return [0, 1].map((k) => (
            <motion.circle
              key={`t-${name}-${k}`}
              fill={st === "idle" ? "#605a4d" : (meta?.color ?? BONE)}
              animate={{
                cx: [h.x, 150],
                cy: [h.y, 100],
                r: [4.5, 1.5],
                opacity: busy ? [0, 0.95, 0] : [0, 0.45, 0],
              }}
              transition={{
                duration: busy ? 1.9 : 3.6,
                repeat: Infinity,
                ease: "easeIn",
                delay: k * (busy ? 0.95 : 1.8) + i * 0.28,
              }}
            />
          ));
        })}
      </g>

      <circle cx={150} cy={100} r={4} fill="#f4f1e8" />
      {SATELLITES.map((name) => {
        const st = agents[name]?.status ?? "idle";
        if (st === "done") return null;
        const h = HOME[name];
        return (
          <text
            key={`l-${name}`}
            x={h.x}
            y={h.y + 27}
            textAnchor="middle"
            fontFamily="var(--font-mono), monospace"
            fontSize="8"
            fill={st === "idle" ? "rgba(241,237,227,0.24)" : "rgba(241,237,227,0.6)"}
          >
            {name.toLowerCase()}
          </text>
        );
      })}
    </svg>
  );
}

/* ── 02 · Tomography ─────────────────────────────────────────────── */

function Tomography({ activeColor, layer }: { activeColor: string; layer: number }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {BANDS.map(([x, w], i) => {
        const hit = 0.07 + (i / BANDS.length) * 0.4;
        return (
          <motion.g
            key={i}
            animate={{ opacity: [0.5, 0.5, 1, 0.5, 0.5] }}
            transition={{
              duration: 7,
              times: [0, Math.max(0, hit - 0.035), hit, Math.min(1, hit + 0.06), 1],
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.rect
              y={22 + i * 13}
              height={6}
              rx={3}
              fill="#2c2519"
              animate={{ x: [x, x + 6, x - 4, x], width: [w, w * 0.82, w * 1.06, w] }}
              transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
            />
            <motion.rect
              y={22 + i * 13}
              height={6}
              rx={3}
              fill={activeColor}
              animate={{ x: [x, x + 6, x - 4, x], width: [w * 0.18, w * 0.3, w * 0.12, w * 0.18], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
            />
          </motion.g>
        );
      })}

      {/* Scanner head */}
      <motion.g animate={{ y: [0, 150, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
        <rect x={0} y={6} width={300} height={28} fill={activeColor} opacity={0.1} />
        <rect x={0} y={33} width={300} height={1.4} fill={activeColor} />
        <motion.circle
          cx={10}
          cy={33.7}
          r={2.6}
          fill={activeColor}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <motion.circle
          cx={290}
          cy={33.7}
          r={2.6}
          fill={activeColor}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      </motion.g>

      {/* Right-hand data column, scrolling forever. */}
      <motion.g animate={{ y: [0, -104] }} transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <rect
            key={i}
            x={276}
            y={i * 8}
            width={((i % 13) * 2) % 11 + 5}
            height={2}
            rx={1}
            fill="rgba(241,237,227,0.2)"
          />
        ))}
      </motion.g>

      <text x={16} y={182} fontFamily="var(--font-mono), monospace" fontSize="8.5" fill="rgba(241,237,227,0.38)">
        layer {String(layer).padStart(2, "0")} / 12 · resolving structure
      </text>
      <Readout x={16} y={193} color="rgba(241,237,227,0.28)" />
    </svg>
  );
}

/* ── 03 · Orbital telemetry ──────────────────────────────────────── */

function Orbital({ agents, anyWorking }: Props & { anyWorking: boolean }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {ORBITS.map((o) => (
        <g
          key={o.tilt}
          transform={`rotate(${o.tilt} 150 100) translate(150 100) scale(1 ${o.squash}) translate(-150 -100)`}
        >
          <motion.circle
            cx={150}
            cy={100}
            r={o.r}
            fill="none"
            stroke="#3a352b"
            strokeWidth={1}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 5 + o.r / 30, repeat: Infinity, ease: "easeInOut" }}
          />
          {o.members.map((name, j) => {
            const meta = AGENTS.find((a) => a.name === name);
            const st = agents[name]?.status ?? "idle";
            const dur = st === "working" ? o.dur * 0.55 : o.dur;
            return (
              <motion.g
                key={name}
                style={{ transformOrigin: "150px 100px", transformBox: "view-box" }}
                animate={{ rotate: 360 }}
                transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
              >
                <g transform={`rotate(${j * 180} 150 100)`}>
                  {[10, 20, 30].map((lag, k) => (
                    <circle
                      key={lag}
                      cx={150 + o.r * Math.cos((lag * Math.PI) / 180)}
                      cy={100 + o.r * Math.sin((-lag * Math.PI) / 180)}
                      r={3 - k * 0.7}
                      fill={st === "idle" ? "#3f3a31" : (meta?.color ?? BONE)}
                      opacity={0.3 - k * 0.08}
                    />
                  ))}
                  <motion.circle
                    cx={150 + o.r}
                    cy={100}
                    fill={st === "idle" ? "#4a443a" : (meta?.color ?? BONE)}
                    animate={{ r: st === "working" ? [5, 7, 5] : 4.5 }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </g>
              </motion.g>
            );
          })}
        </g>
      ))}

      <circle cx={150} cy={100} r={12} fill="#100e0a" stroke="rgba(241,237,227,0.3)" />
      {[0, 1].map((i) => (
        <motion.circle
          key={i}
          cx={150}
          cy={100}
          fill="none"
          stroke="rgba(241,237,227,0.3)"
          animate={{ r: [13, 46], opacity: [0.5, 0] }}
          transition={{
            duration: anyWorking ? 2.6 : 4.4,
            delay: i * (anyWorking ? 1.3 : 2.2),
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <text x={150} y={104} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="8" fill="rgba(241,237,227,0.5)">
        core
      </text>
    </svg>
  );
}

/* ── 04 · Star chart ─────────────────────────────────────────────── */

function StarChart({ agents, doneCount }: Props & { doneCount: number }) {
  const points = STARS.map((s) => `${s.x},${s.y}`).join(" ");
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <motion.ellipse
        cx={170}
        cy={90}
        rx={110}
        ry={64}
        fill="rgba(207,202,188,0.035)"
        animate={{ rx: [110, 124, 110], ry: [64, 56, 64], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {FIELD.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={1.4}
          fill="#6b6558"
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}

      {/* A meteor crosses the field now and then. */}
      <motion.line
        x1={-30}
        y1={20}
        x2={6}
        y2={32}
        stroke="rgba(241,237,227,0.55)"
        strokeWidth={1}
        animate={{ x: [0, 360], y: [0, 120], opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5.5, ease: "easeIn" }}
      />

      <motion.polyline
        points={points}
        fill="none"
        stroke={BONE}
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
          <g key={s.name}>
            {lit ? (
              <motion.circle
                cx={s.x}
                cy={s.y}
                fill="none"
                stroke={meta?.color ?? BONE}
                animate={{ r: [5, 15], opacity: [0.55, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
            <motion.circle
              cx={s.x}
              cy={s.y}
              fill={st === "idle" ? "#5c564a" : (meta?.color ?? "#f0e8d6")}
              animate={
                st === "working"
                  ? { r: [3.5, 6, 3.5], opacity: [0.7, 1, 0.7] }
                  : { r: lit ? 4.5 : 2.6, opacity: lit ? 1 : [0.3, 0.5, 0.3] }
              }
              transition={{ duration: st === "working" ? 1.4 : 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
        );
      })}

      <text x={16} y={190} fontFamily="var(--font-mono), monospace" fontSize="8.5" fill="rgba(241,237,227,0.38)">
        {doneCount} of {STARS.length} charted
      </text>
    </svg>
  );
}

/* ── Stage ───────────────────────────────────────────────────────── */

export function AgentCanvas({ agents }: Props) {
  const anyWorking = Object.values(agents).some((a) => a?.status === "working");
  const doneCount = Object.values(agents).filter((a) => a?.status === "done").length;

  const focusName = (["synthesizer", "critic", ...WORKERS.map((w) => w.name)] as AgentName[]).find(
    (n) => agents[n]?.status === "working",
  );
  const focusMeta = focusName ? AGENTS.find((a) => a.name === focusName) : undefined;
  const focusLine = focusName ? agents[focusName]?.preview ?? agents[focusName]?.detail : undefined;
  const accent = focusMeta?.color ?? BONE;

  // Attention walks the wall: one screen refreshes, then the next.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFocusTick((v) => v + 1), 3400);
    return () => clearInterval(t);
  }, []);
  const focusPanel = focusTick % 4;

  // The wall leans toward the pointer.
  const stage = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 55, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), spring);
  const slow = {
    x: useSpring(useTransform(px, [-0.5, 0.5], [14, -14]), spring),
    y: useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), spring),
  };
  const fast = {
    x: useSpring(useTransform(px, [-0.5, 0.5], [-22, 22]), spring),
    y: useSpring(useTransform(py, [-0.5, 0.5], [-15, 15]), spring),
  };

  const onMove = (e: React.PointerEvent) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const panels = [
    {
      mark: "01",
      title: "mercury pool",
      stat: `${doneCount} merged`,
      corner: "tl" as const,
      node: <MercuryPool agents={agents} doneCount={doneCount} />,
    },
    {
      mark: "02",
      title: "tomography",
      stat: anyWorking ? "scanning" : "standby",
      corner: "tr" as const,
      node: <Tomography activeColor={accent} layer={Math.min(12, doneCount * 2 + 1)} />,
    },
    {
      mark: "03",
      title: "orbital telemetry",
      stat: `${ORBITS.length} rings`,
      corner: "bl" as const,
      node: <Orbital agents={agents} anyWorking={anyWorking} />,
    },
    {
      mark: "04",
      title: "star chart",
      stat: `${doneCount}/6 charted`,
      corner: "br" as const,
      node: <StarChart agents={agents} doneCount={doneCount} />,
    },
  ];

  return (
    <motion.div
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl"
      style={{
        background: "radial-gradient(120% 100% at 50% 35%, #14110b 0%, #0a0806 55%, #050403 100%)",
        boxShadow: "inset 0 1px 0 rgba(241,237,227,0.07)",
        perspective: 1600,
      }}
    >
      <div className="relative z-30 px-4 pt-4">
        <MissionBar agents={agents} accent={accent} />
      </div>

      <motion.div
        className="relative grid flex-1 grid-cols-1 sm:grid-cols-2"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          borderTop: `1px solid ${STAGE_LINE}`,
        }}
      >
        {panels.map((p, i) => (
          <div
            key={p.mark}
            style={{
              transformStyle: "preserve-3d",
              borderRight: i % 2 === 0 ? `1px solid ${STAGE_LINE}` : undefined,
              borderBottom: i < 2 ? `1px solid ${STAGE_LINE}` : undefined,
            }}
          >
            <Panel
              mark={p.mark}
              title={p.title}
              stat={p.stat}
              corner={p.corner}
              focused={focusPanel === i}
              focusTick={focusTick}
              accent={accent}
              slow={slow}
              fast={fast}
            >
              {p.node}
            </Panel>
          </div>
        ))}

        {/* Centre HUD — floats above the crosshair where the four screens meet. */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(26rem,78vw)] -translate-x-1/2 -translate-y-1/2"
          style={{ z: 130, x: fast.x, y: fast.y }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={focusName ?? "idle"}
              initial={{ opacity: 0, scale: 0.92, rotateX: -12 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border px-5 py-4 font-mono text-[11px]"
              style={{
                borderColor: `${accent}55`,
                background: "rgba(10,8,6,0.55)",
                backdropFilter: "blur(24px) saturate(1.5)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 70px -22px rgba(0,0,0,0.95), 0 0 0 1px ${accent}18`,
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
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
