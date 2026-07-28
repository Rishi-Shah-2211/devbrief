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
 * Quad-view mission stage — a concave wall of four instrument screens, each
 * reading the same run a different way. Everything is drawn in a 900×600
 * coordinate space so strokes land sub-pixel and detail stays crisp at any
 * display density. Every coordinate is a constant: nothing is measured, so
 * nothing can flicker.
 */
const STAGE_LINE = "rgba(241,237,227,0.09)";
const BONE = "#cfcabc";
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

const SATELLITES = [...WORKERS.map((w) => w.name), "critic"] as AgentName[];

const HOME: Record<string, { x: number; y: number }> = {
  architect: { x: 174, y: 156 },
  dependency: { x: 726, y: 138 },
  docs: { x: 138, y: 450 },
  startHere: { x: 450, y: 522 },
  critic: { x: 756, y: 438 },
};

const ORBITS: { tilt: number; r: number; squash: number; dur: number; members: AgentName[] }[] = [
  { tilt: -18, r: 288, squash: 0.4, dur: 16, members: ["architect", "dependency"] },
  { tilt: 26, r: 210, squash: 0.5, dur: 11, members: ["docs", "startHere"] },
  { tilt: -54, r: 138, squash: 0.36, dur: 7.5, members: ["critic", "synthesizer"] },
];

const STARS: { name: AgentName; x: number; y: number }[] = [
  { name: "architect", x: 174, y: 414 },
  { name: "docs", x: 300, y: 198 },
  { name: "dependency", x: 468, y: 324 },
  { name: "startHere", x: 606, y: 132 },
  { name: "critic", x: 426, y: 498 },
  { name: "synthesizer", x: 750, y: 276 },
];

/** Deterministic star field — no randomness, so server and client agree. */
const DUST = Array.from({ length: 46 }, (_, i) => ({
  x: ((i * 137) % 872) + 14,
  y: ((i * 211) % 566) + 17,
  r: ((i % 4) * 0.5 + 0.7).toFixed(1),
  twinkle: i % 3 === 0,
}));

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

/** Telemetry that never stops moving, isolated so it re-renders alone. */
function Readout({ x, y, color }: { x: number; y: number; color: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => v + 1), 300);
    return () => clearInterval(t);
  }, []);
  return (
    <text x={x} y={y} fontFamily="var(--font-mono), monospace" fontSize="13" fill={color}>
      0x{(0x4f2a71 + n * 7333).toString(16).slice(-6)} · {String((n * 37) % 960).padStart(3, "0")} kb/s ·
      buf {String((n * 13) % 100).padStart(2, "0")}%
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
  const nearX = useTransform(fast.x, (v) => v * 1.7);
  const nearY = useTransform(fast.y, (v) => v * 1.7);

  return (
    <motion.div
      className="relative min-h-[46vh] overflow-hidden"
      style={{ transformOrigin: c.origin, zIndex: focused ? 10 : 1 }}
      animate={{
        rotateY: focused ? c.ry * 0.25 : c.ry,
        rotateX: focused ? c.rx * 0.25 : c.rx,
        z: focused ? 74 : 0,
        scale: focused ? 1.025 : 1,
        filter: focused ? "brightness(1.14) saturate(1.1)" : "brightness(0.78) saturate(0.9)",
      }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Far field: instrument grid + accent wash, softly out of focus. */}
      <motion.div
        className="pointer-events-none absolute -inset-10"
        style={{
          x: slow.x,
          y: slow.y,
          filter: "blur(0.4px)",
          backgroundImage:
            "linear-gradient(rgba(241,237,227,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(241,237,227,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px, 56px 56px",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-10"
        style={{
          x: slow.x,
          y: slow.y,
          background: `radial-gradient(65% 55% at 50% 45%, ${accent}1c, transparent 72%)`,
        }}
      />

      {/* Mid layer: the instrument itself. */}
      <motion.div className="absolute inset-0" style={{ x: fast.x, y: fast.y }}>
        {children}
      </motion.div>

      {/* Optical finish: grain then vignette, so nothing reads as a flat fill. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: 0.2, mixBlendMode: "overlay" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(130% 105% at 50% 48%, transparent 42%, rgba(0,0,0,0.62) 100%)" }}
      />

      {/* Near layer: labels and brackets, drift most. */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ x: nearX, y: nearY }}>
        <div className="absolute inset-x-0 top-0 flex items-baseline justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span style={{ color: focused ? accent : "rgba(241,237,227,0.45)" }}>
            <span style={{ color: "rgba(241,237,227,0.26)" }}>{mark} · </span>
            {title}
          </span>
          <span style={{ color: "rgba(241,237,227,0.32)" }}>{focused ? "refreshing" : stat}</span>
        </div>
        {(["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"] as const).map((p, i) => (
          <span
            key={p}
            className={`absolute ${p} h-3.5 w-3.5`}
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
            style={{ background: accent, boxShadow: `0 0 30px 4px ${accent}` }}
            initial={{ top: "-2%", opacity: 0 }}
            animate={{ top: "102%", opacity: [0, 0.9, 0.9, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeInOut" }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

const SVG_PROPS = {
  viewBox: "0 0 900 600",
  preserveAspectRatio: "xMidYMid slice" as const,
  className: "absolute inset-0 h-full w-full",
};

/* ── 01 · Mercury pool ───────────────────────────────────────────── */

function MercuryPool({ agents, doneCount }: Props & { doneCount: number }) {
  const core = 46 + doneCount * 7;
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <radialGradient id="mg-core" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="45%" stopColor="#d8d3c6" />
          <stop offset="100%" stopColor="#9c968a" />
        </radialGradient>
        <radialGradient id="mg-floor" cx="50%" cy="46%">
          <stop offset="0%" stopColor="#241f16" />
          <stop offset="100%" stopColor="#0a0806" stopOpacity="0" />
        </radialGradient>
        <filter id="mg-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12" />
        </filter>
        <filter id="mg-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="900" height="600" fill="url(#mg-floor)" />

      {/* Basin: measured rings with bearing ticks. */}
      {[110, 172, 234, 296, 358].map((r, i) => (
        <circle
          key={r}
          cx={450}
          cy={300}
          r={r}
          fill="none"
          stroke="rgba(207,202,188,0.08)"
          strokeWidth={i === 2 ? 1.2 : 0.7}
          strokeDasharray={i % 2 ? "3 9" : undefined}
        />
      ))}
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i * 7.5 * Math.PI) / 180;
        const long = i % 4 === 0;
        const r0 = long ? 344 : 352;
        return (
          <line
            key={i}
            x1={450 + Math.cos(a) * r0}
            y1={300 + Math.sin(a) * r0}
            x2={450 + Math.cos(a) * 362}
            y2={300 + Math.sin(a) * 362}
            stroke="rgba(207,202,188,0.16)"
            strokeWidth={long ? 1.1 : 0.6}
          />
        );
      })}

      {/* Caustics — the surface is never still. */}
      {[120, 190, 262, 334].map((r, i) => (
        <motion.circle
          key={r}
          cx={450}
          cy={300}
          fill="none"
          stroke="rgba(207,202,188,0.1)"
          strokeWidth={1.2}
          animate={{ r: [r, r + 26, r], opacity: [0.65, 0.12, 0.65] }}
          transition={{ duration: 6 + i * 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
        />
      ))}

      {/* Feed lines: dashes march down every stream, always. */}
      {SATELLITES.map((name, i) => {
        const meta = AGENTS.find((a) => a.name === name);
        const st = agents[name]?.status ?? "idle";
        const h = HOME[name];
        return (
          <motion.line
            key={`s-${name}`}
            x1={h.x}
            y1={h.y}
            x2={450}
            y2={300}
            stroke={st === "idle" ? "rgba(207,202,188,0.14)" : (meta?.color ?? BONE)}
            strokeOpacity={st === "working" ? 0.5 : 0.22}
            strokeWidth={st === "working" ? 1.6 : 1}
            strokeDasharray="7 19"
            animate={{ strokeDashoffset: [0, -52] }}
            transition={{ duration: st === "working" ? 0.9 : 2.2, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
          />
        );
      })}

      <g filter="url(#mg-goo)">
        <motion.circle
          cx={450}
          cy={300}
          fill="url(#mg-core)"
          animate={{ r: [core, core + 9, core] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {[0, 1, 2, 3].map((i) => (
          <motion.circle
            key={`bead-${i}`}
            fill={BONE}
            animate={{
              cx: [450 + 30, 450, 450 - 30, 450, 450 + 30],
              cy: [300, 300 + 30, 300, 300 - 30, 300],
              r: [15, 22, 15, 19, 15],
            }}
            transition={{ duration: 4.2 + i * 0.9, repeat: Infinity, ease: "linear", delay: i * 0.85 }}
          />
        ))}
        {SATELLITES.map((name, i) => {
          const meta = AGENTS.find((a) => a.name === name);
          const st = agents[name]?.status ?? "idle";
          const merged = st === "done";
          const h = HOME[name];
          const cx0 = merged ? 450 : h.x;
          const cy0 = merged ? 300 : h.y;
          const w = merged ? 18 : st === "working" ? 34 : 22;
          return (
            <motion.circle
              key={name}
              fill={st === "idle" ? "#605a4d" : merged ? BONE : (meta?.color ?? BONE)}
              animate={{
                cx: [cx0 + w, cx0, cx0 - w, cx0, cx0 + w],
                cy: [cy0, cy0 + w, cy0, cy0 - w, cy0],
                r: st === "working" ? [36, 45, 36] : merged ? [34, 39, 34] : [26, 31, 26],
              }}
              transition={{
                duration: st === "working" ? 3 : 5.5 + i * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.35,
              }}
            />
          );
        })}
      </g>

      {/* Droplets in transit — crisp and lit, outside the goo so they read. */}
      {SATELLITES.flatMap((name, i) => {
        const st = agents[name]?.status ?? "idle";
        if (st === "done") return [];
        const meta = AGENTS.find((a) => a.name === name);
        const h = HOME[name];
        const busy = st === "working";
        return [0, 1].map((k) => (
          <motion.circle
            key={`t-${name}-${k}`}
            filter="url(#mg-glow)"
            fill={st === "idle" ? "#8d8674" : (meta?.color ?? BONE)}
            animate={{
              cx: [h.x, 450],
              cy: [h.y, 300],
              r: [13, 4],
              opacity: busy ? [0, 1, 0] : [0, 0.5, 0],
            }}
            transition={{
              duration: busy ? 1.7 : 3.2,
              repeat: Infinity,
              ease: "easeIn",
              delay: k * (busy ? 0.85 : 1.6) + i * 0.22,
            }}
          />
        ));
      })}

      {/* Impact rings — something is always landing in the pool. */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`splash-${i}`}
          cx={450}
          cy={300}
          fill="none"
          stroke={BONE}
          strokeWidth={1.6}
          animate={{ r: [core, core + 96], opacity: [0.55, 0] }}
          transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Rotating specular catch on the pool surface. */}
      <motion.g
        style={{ transformOrigin: "450px 300px", transformBox: "view-box" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        <path
          d={`M ${450 - core * 0.62} ${300 - core * 0.42} A ${core * 0.78} ${core * 0.78} 0 0 1 ${450 + core * 0.1} ${300 - core * 0.75}`}
          fill="none"
          stroke="rgba(255,253,247,0.75)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </motion.g>

      {SATELLITES.map((name) => {
        const st = agents[name]?.status ?? "idle";
        if (st === "done") return null;
        const meta = AGENTS.find((a) => a.name === name);
        const h = HOME[name];
        return (
          <g key={`l-${name}`}>
            <line x1={h.x - 34} y1={h.y + 52} x2={h.x + 34} y2={h.y + 52} stroke="rgba(241,237,227,0.14)" strokeWidth={0.8} />
            <text
              x={h.x}
              y={h.y + 70}
              textAnchor="middle"
              fontFamily="var(--font-mono), monospace"
              fontSize="13"
              letterSpacing="1.6"
              fill={st === "idle" ? "rgba(241,237,227,0.26)" : (meta?.color ?? BONE)}
            >
              {name.toLowerCase()}
            </text>
            <text
              x={h.x}
              y={h.y + 86}
              textAnchor="middle"
              fontFamily="var(--font-mono), monospace"
              fontSize="11"
              fill="rgba(241,237,227,0.22)"
            >
              {st === "working" ? "feeding" : st === "error" ? "lost" : "holding"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 02 · Tomography ─────────────────────────────────────────────── */

const BAND_X = (i: number) => 108 + ((i * 37) % 104);
const BAND_W = (i: number) => 250 + ((i * 53) % 400);

function Tomography({ activeColor, layer }: { activeColor: string; layer: number }) {
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <linearGradient id="tg-band" x1="0" x2="1">
          <stop offset="0%" stopColor="#241f18" />
          <stop offset="55%" stopColor="#37301f" />
          <stop offset="100%" stopColor="#221d15" />
        </linearGradient>
        <linearGradient id="tg-scan" x1="0" x2="1">
          <stop offset="0%" stopColor={activeColor} stopOpacity="0" />
          <stop offset="18%" stopColor={activeColor} stopOpacity="0.9" />
          <stop offset="82%" stopColor={activeColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
        </linearGradient>
        <filter id="tg-glow" x="-60%" y="-400%" width="220%" height="900%">
          <feGaussianBlur stdDeviation="6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Instrument grid */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`v${i}`} x1={90 + i * 68} y1={40} x2={90 + i * 68} y2={556} stroke="rgba(241,237,227,0.035)" strokeWidth={0.7} />
      ))}
      {/* Depth ruler */}
      {Array.from({ length: 27 }, (_, i) => {
        const y = 56 + i * 19;
        const long = i % 5 === 0;
        return (
          <g key={`r${i}`}>
            <line x1={44} y1={y} x2={long ? 74 : 62} y2={y} stroke="rgba(241,237,227,0.2)" strokeWidth={long ? 1.1 : 0.6} />
            {long ? (
              <text x={16} y={y + 4} fontFamily="var(--font-mono), monospace" fontSize="11" fill="rgba(241,237,227,0.28)">
                {String(i * 20).padStart(3, "0")}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Strata */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = BAND_X(i);
        const w = BAND_W(i);
        const y = 62 + i * 21;
        const hit = 0.07 + (i / 24) * 0.4;
        const churn = i % 2 === 0;
        return (
          <motion.g
            key={i}
            animate={{ opacity: [0.48, 0.48, 1, 0.48, 0.48] }}
            transition={{
              duration: 7,
              times: [0, Math.max(0, hit - 0.035), hit, Math.min(1, hit + 0.06), 1],
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {churn ? (
              <motion.rect
                y={y}
                height={9}
                rx={4.5}
                fill="url(#tg-band)"
                animate={{ x: [x, x + 16, x - 10, x], width: [w, w * 0.84, w * 1.05, w] }}
                transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.16 }}
              />
            ) : (
              <rect x={x} y={y} width={w} height={9} rx={4.5} fill="url(#tg-band)" />
            )}
            <rect x={x + 6} y={y + 2.5} width={Math.min(w * 0.22, 90)} height={4} rx={2} fill={activeColor} opacity={0.5} />
            <rect x={x + w - 14} y={y + 2} width={5} height={5} rx={2.5} fill="rgba(241,237,227,0.3)" />
          </motion.g>
        );
      })}

      {/* Scanner head */}
      <motion.g animate={{ y: [0, 450, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
        <rect x={0} y={22} width={900} height={64} fill={activeColor} opacity={0.09} />
        <rect x={40} y={62} width={820} height={1} fill={activeColor} opacity={0.3} />
        <rect x={40} y={86} width={820} height={1} fill={activeColor} opacity={0.3} />
        <rect x={0} y={73} width={900} height={2.4} fill="url(#tg-scan)" filter="url(#tg-glow)" />
        <motion.circle
          cx={30}
          cy={74}
          r={5}
          fill={activeColor}
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <motion.circle
          cx={870}
          cy={74}
          r={5}
          fill={activeColor}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <path d="M 12 66 L 24 74 L 12 82 Z" fill={activeColor} opacity={0.8} />
        <path d="M 888 66 L 876 74 L 888 82 Z" fill={activeColor} opacity={0.8} />
      </motion.g>

      {/* Data column, scrolling forever */}
      <motion.g animate={{ y: [0, -288] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
        {Array.from({ length: 40 }, (_, i) => (
          <g key={i}>
            <rect x={834} y={i * 24} width={(((i % 12) * 4) % 26) + 10} height={4} rx={2} fill="rgba(241,237,227,0.22)" />
            <rect x={834} y={i * 24 + 8} width={(((i % 7) * 6) % 34) + 6} height={2} rx={1} fill="rgba(241,237,227,0.12)" />
          </g>
        ))}
      </motion.g>

      {/* Spectrum along the floor */}
      {Array.from({ length: 22 }, (_, i) => (
        <motion.rect
          key={`h${i}`}
          x={106 + i * 30}
          width={16}
          rx={2}
          fill={activeColor}
          opacity={0.32}
          animate={{ height: [10 + (i % 5) * 6, 34 + (i % 7) * 5, 10 + (i % 5) * 6], y: [566, 542 - (i % 7) * 5, 566] }}
          transition={{ duration: 1.8 + (i % 5) * 0.35, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
        />
      ))}

      <text x={44} y={528} fontFamily="var(--font-mono), monospace" fontSize="13" letterSpacing="1.4" fill="rgba(241,237,227,0.42)">
        layer {String(layer).padStart(2, "0")} / 24 · resolving structure
      </text>
      <Readout x={44} y={548} color="rgba(241,237,227,0.28)" />
    </svg>
  );
}

/* ── 03 · Orbital telemetry ──────────────────────────────────────── */

function Orbital({ agents, anyWorking }: Props & { anyWorking: boolean }) {
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <radialGradient id="og-core" cx="36%" cy="30%">
          <stop offset="0%" stopColor="#f6f2e8" />
          <stop offset="40%" stopColor="#8e8779" />
          <stop offset="100%" stopColor="#16130d" />
        </radialGradient>
        <radialGradient id="og-floor" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1d1a12" />
          <stop offset="100%" stopColor="#070605" stopOpacity="0" />
        </radialGradient>
        <filter id="og-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="900" height="600" fill="url(#og-floor)" />
      {DUST.slice(0, 30).map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.9} fill="rgba(241,237,227,0.16)" />
      ))}

      {/* Reticle */}
      <line x1={60} y1={300} x2={840} y2={300} stroke="rgba(241,237,227,0.05)" strokeWidth={0.8} />
      <line x1={450} y1={40} x2={450} y2={560} stroke="rgba(241,237,227,0.05)" strokeWidth={0.8} />

      {ORBITS.map((o, oi) => (
        <g
          key={o.tilt}
          transform={`rotate(${o.tilt} 450 300) translate(450 300) scale(1 ${o.squash}) translate(-450 -300)`}
        >
          <motion.circle
            cx={450}
            cy={300}
            r={o.r}
            fill="none"
            stroke="#4a4336"
            strokeWidth={1}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 5 + oi * 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Degree graduations around the ring */}
          {Array.from({ length: 36 }, (_, k) => {
            const a = (k * 10 * Math.PI) / 180;
            const long = k % 9 === 0;
            return (
              <line
                key={k}
                x1={450 + Math.cos(a) * (o.r - (long ? 12 : 6))}
                y1={300 + Math.sin(a) * (o.r - (long ? 12 : 6))}
                x2={450 + Math.cos(a) * o.r}
                y2={300 + Math.sin(a) * o.r}
                stroke="rgba(241,237,227,0.18)"
                strokeWidth={long ? 1.2 : 0.6}
              />
            );
          })}
          {o.members.map((name, j) => {
            const meta = AGENTS.find((a) => a.name === name);
            const st = agents[name]?.status ?? "idle";
            const dur = st === "working" ? o.dur * 0.55 : o.dur;
            const color = st === "idle" ? "#4a443a" : (meta?.color ?? BONE);
            return (
              <motion.g
                key={name}
                style={{ transformOrigin: "450px 300px", transformBox: "view-box" }}
                animate={{ rotate: 360 }}
                transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
              >
                <g transform={`rotate(${j * 180} 450 300)`}>
                  {[6, 13, 21, 30, 40].map((lag, k) => (
                    <circle
                      key={lag}
                      cx={450 + o.r * Math.cos((lag * Math.PI) / 180)}
                      cy={300 + o.r * Math.sin((-lag * Math.PI) / 180)}
                      r={9 - k * 1.5}
                      fill={color}
                      opacity={0.34 - k * 0.06}
                    />
                  ))}
                  <motion.circle
                    cx={450 + o.r}
                    cy={300}
                    fill={color}
                    filter={st === "idle" ? undefined : "url(#og-glow)"}
                    animate={{ r: st === "working" ? [12, 17, 12] : 10 }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </g>
              </motion.g>
            );
          })}
        </g>
      ))}

      <circle cx={450} cy={300} r={34} fill="url(#og-core)" stroke="rgba(241,237,227,0.32)" strokeWidth={1.2} />
      <motion.g
        style={{ transformOrigin: "450px 300px", transformBox: "view-box" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <path d="M 428 284 A 26 26 0 0 1 456 274" fill="none" stroke="rgba(255,253,247,0.7)" strokeWidth={2.4} strokeLinecap="round" />
      </motion.g>
      {[0, 1].map((i) => (
        <motion.circle
          key={i}
          cx={450}
          cy={300}
          fill="none"
          stroke="rgba(241,237,227,0.3)"
          strokeWidth={1.2}
          animate={{ r: [36, 132], opacity: [0.5, 0] }}
          transition={{
            duration: anyWorking ? 2.6 : 4.4,
            delay: i * (anyWorking ? 1.3 : 2.2),
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {ORBITS.map((o, i) => (
        <text
          key={o.r}
          x={470}
          y={300 - o.r * o.squash - 8}
          fontFamily="var(--font-mono), monospace"
          fontSize="11"
          fill="rgba(241,237,227,0.28)"
        >
          R{i + 1} · {o.r}
        </text>
      ))}
      <text x={450} y={306} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="rgba(241,237,227,0.75)">
        core
      </text>
    </svg>
  );
}

/* ── 04 · Star chart ─────────────────────────────────────────────── */

function StarChart({ agents, doneCount }: Props & { doneCount: number }) {
  const points = STARS.map((s) => `${s.x},${s.y}`).join(" ");
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <radialGradient id="sc-neb" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#cfcabc" stopOpacity="0.1" />
          <stop offset="60%" stopColor="#8a8474" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sc-meteor" x1="0" x2="1">
          <stop offset="0%" stopColor="#f4f1e8" stopOpacity="0" />
          <stop offset="100%" stopColor="#f4f1e8" stopOpacity="0.9" />
        </linearGradient>
        <filter id="sc-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.ellipse
        cx={510}
        cy={270}
        fill="url(#sc-neb)"
        animate={{ rx: [330, 372, 330], ry: [192, 168, 192], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Coordinate net */}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`gv${i}`} x1={90 + i * 90} y1={30} x2={90 + i * 90} y2={570} stroke="rgba(241,237,227,0.035)" strokeDasharray="2 8" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`gh${i}`} x1={30} y1={80 + i * 90} x2={870} y2={80 + i * 90} stroke="rgba(241,237,227,0.035)" strokeDasharray="2 8" />
      ))}

      {DUST.map((d, i) =>
        d.twinkle ? (
          <motion.circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={Number(d.r)}
            fill="#8d8674"
            animate={{ opacity: [0.22, 0.95, 0.22] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: i * 0.21 }}
          />
        ) : (
          <circle key={i} cx={d.x} cy={d.y} r={Number(d.r)} fill="#6b6558" opacity={0.5} />
        ),
      )}

      <motion.g
        animate={{ x: [-120, 900], y: [0, 320], opacity: [0, 1, 0] }}
        transition={{ duration: 2.3, repeat: Infinity, repeatDelay: 5, ease: "easeIn" }}
      >
        <rect x={0} y={60} width={110} height={1.6} fill="url(#sc-meteor)" />
        <circle cx={110} cy={60.8} r={2.6} fill="#f4f1e8" filter="url(#sc-glow)" />
      </motion.g>

      <motion.polyline
        points={points}
        fill="none"
        stroke={BONE}
        strokeWidth={1.4}
        opacity={0.6}
        filter="url(#sc-glow)"
        pathLength={1}
        strokeDasharray={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - doneCount / STARS.length }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {STARS.map((s) => {
        const meta = AGENTS.find((a) => a.name === s.name);
        const st = agents[s.name]?.status ?? "idle";
        const lit = st === "done" || st === "working";
        const color = st === "idle" ? "#5c564a" : (meta?.color ?? "#f0e8d6");
        return (
          <g key={s.name}>
            {lit ? (
              <>
                <motion.circle
                  cx={s.x}
                  cy={s.y}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.2}
                  animate={{ r: [14, 48], opacity: [0.5, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                />
                <line x1={s.x - 22} y1={s.y} x2={s.x + 22} y2={s.y} stroke={color} strokeWidth={0.7} opacity={0.35} />
                <line x1={s.x} y1={s.y - 22} x2={s.x} y2={s.y + 22} stroke={color} strokeWidth={0.7} opacity={0.35} />
              </>
            ) : null}
            <motion.circle
              cx={s.x}
              cy={s.y}
              fill={color}
              filter={lit ? "url(#sc-glow)" : undefined}
              animate={
                st === "working"
                  ? { r: [10, 17, 10], opacity: [0.75, 1, 0.75] }
                  : { r: lit ? 13 : 7, opacity: lit ? 1 : [0.3, 0.55, 0.3] }
              }
              transition={{ duration: st === "working" ? 1.4 : 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <text
              x={s.x + 20}
              y={s.y - 16}
              fontFamily="var(--font-mono), monospace"
              fontSize="11"
              letterSpacing="1.2"
              fill={lit ? color : "rgba(241,237,227,0.24)"}
            >
              {s.name.toLowerCase()}
            </text>
          </g>
        );
      })}

      <text x={44} y={556} fontFamily="var(--font-mono), monospace" fontSize="13" letterSpacing="1.4" fill="rgba(241,237,227,0.42)">
        {doneCount} of {STARS.length} charted · field 04
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
      node: <Tomography activeColor={accent} layer={Math.min(24, doneCount * 4 + 1)} />,
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
              className="relative overflow-hidden rounded-2xl border px-5 py-4 font-mono text-[11px]"
              style={{
                borderColor: `${accent}55`,
                background: "rgba(10,8,6,0.55)",
                backdropFilter: "blur(26px) saturate(1.6)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -14px 26px -20px rgba(0,0,0,0.9), 0 30px 70px -22px rgba(0,0,0,0.95), 0 0 0 1px ${accent}18`,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: GRAIN, opacity: 0.14, mixBlendMode: "overlay" }}
              />
              <div
                className="relative mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em]"
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
              <p className="relative line-clamp-3 break-words leading-relaxed" style={{ color: "rgba(241,237,227,0.82)" }}>
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
