"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS, WORKERS } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName, AgentStatus } from "@/orchestrator/types";

/**
 * Deep-sonar canvas, v2 — an immersive tilted radar table. The whole field
 * leans back in 3D and breathes, marine snow drifts through the water column,
 * echo waves ripple out of the emitter, and the active agent's transmission
 * is intercepted on a floating side panel. All positions are fixed
 * percentages — nothing is measured, nothing can flicker.
 */
const SONAR = "#6fe3c2";
const SONAR_DIM = "#1d5a52";

const POS: Record<string, { x: number; y: number }> = {
  architect: { x: 50, y: 24 },
  dependency: { x: 68, y: 42 },
  docs: { x: 33, y: 39 },
  startHere: { x: 41, y: 71 },
  critic: { x: 67, y: 69 },
  synthesizer: { x: 78, y: 27 },
};

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

function MissionBar({ agents }: Props) {
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-3 z-30 mx-auto mb-2 flex w-fit items-center gap-6 rounded-full border px-5 py-2 font-mono text-[11px] backdrop-blur-md"
      style={{ borderColor: "rgba(111,227,194,0.25)", background: "rgba(4,16,21,0.55)", color: "rgba(111,227,194,0.8)", backdropFilter: "blur(20px) saturate(1.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}
    >
      <span className="flex items-center gap-1.5">
        <motion.span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: SONAR }}
          animate={finished ? {} : { opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {finished ? "CONTACT CONFIRMED" : "SCANNING"}
      </span>
      <span>
        T+{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
      </span>
      <span>{tokens.toLocaleString()} tok</span>
      <span>{done}/6 contacts</span>
    </motion.div>
  );
}

/** A single sonar contact: dim until found, rippling while active, solid when confirmed. */
function Ping({
  x,
  y,
  color,
  label,
  state,
  bobDelay,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
  state?: AgentState;
  bobDelay: number;
}) {
  const status: AgentStatus = state?.status ?? "idle";
  const active = status === "working";
  const dotColor = status === "idle" ? SONAR_DIM : active ? color : status === "error" ? "#ff6188" : color;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ y: active ? 0 : [0, -6, 0] }}
      transition={active ? { duration: 0.4 } : { duration: 5 + bobDelay, repeat: Infinity, ease: "easeInOut", delay: bobDelay }}
    >
      <div className="relative grid -translate-x-1/2 -translate-y-1/2 place-items-center">
        {active
          ? [0, 0.9].map((delay) => (
              <motion.span
                key={delay}
                className="absolute rounded-full border"
                style={{ borderColor: color, width: 16, height: 16 }}
                animate={{ scale: [1, 4.6], opacity: [0.75, 0] }}
                transition={{ duration: 1.8, delay, repeat: Infinity, ease: "easeOut" }}
              />
            ))
          : null}
        <motion.span
          className="block rounded-full"
          style={{
            width: active ? 15 : 11,
            height: active ? 15 : 11,
            background: dotColor,
            boxShadow: status === "idle" ? "none" : `0 0 18px ${dotColor}`,
          }}
          animate={active ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={active ? { duration: 1.1, repeat: Infinity } : {}}
        />
        <div
          className="absolute left-5 top-1/2 w-max -translate-y-1/2 font-mono text-[11px] leading-tight"
          style={{ color: status === "idle" ? "rgba(111,227,194,0.35)" : color }}
        >
          {label}
          <span className="ml-2 opacity-70">
            {status === "working" ? "▸ tracking" : status === "done" ? "✓" : status === "error" ? "✕ lost" : "…"}
          </span>
          {state?.tokensUsed ? <span className="ml-2 opacity-50">{state.tokensUsed.toLocaleString()}t</span> : null}
        </div>
      </div>
    </motion.div>
  );
}

export function AgentCanvas({ agents }: Props) {
  const anyWorking = Object.values(agents).some((a) => a?.status === "working");

  const focusName = (["synthesizer", "critic", ...WORKERS.map((w) => w.name)] as AgentName[]).find(
    (n) => agents[n]?.status === "working",
  );
  const focusMeta = focusName ? AGENTS.find((a) => a.name === focusName) : undefined;
  const focusLine = focusName ? agents[focusName]?.preview ?? agents[focusName]?.detail : undefined;

  // Marine snow: slow particles drifting up through the water column.
  const dust = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left: 4 + Math.random() * 92,
        top: 8 + Math.random() * 88,
        dur: 7 + Math.random() * 9,
        delay: Math.random() * 6,
        size: Math.random() > 0.7 ? 3 : 2,
      })),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl"
      style={{
        background: "radial-gradient(120% 100% at 50% 30%, #082028 0%, #04121a 60%, #020a10 100%)",
        boxShadow: "inset 0 1px 0 rgba(111,227,194,0.08)",
        perspective: 1200,
      }}
    >
      <div className="relative z-20 px-4 pt-5">
        <MissionBar agents={agents} />
      </div>

      {/* Marine snow — the water is alive. */}
      {dust.map((d, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, background: "rgba(111,227,194,0.35)" }}
          animate={{ y: [-6, -58], opacity: [0, 0.55, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* The radar table — tilted in 3D, breathing slowly. */}
      <motion.div
        className="relative flex-1"
        style={{ transformStyle: "preserve-3d", transformOrigin: "50% 60%" }}
        animate={{ rotateX: [16, 21, 16], y: [0, -6, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Concentric rings */}
        {[20, 34, 48, 62].map((r, i) => (
          <motion.div
            key={r}
            className="absolute rounded-full border"
            style={{
              left: "52%",
              top: "50%",
              width: `${r}vmin`,
              height: `${r}vmin`,
              transform: "translate(-50%, -50%)",
              borderColor: "rgba(111,227,194,0.14)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
          />
        ))}

        {/* Bearing lines */}
        <div className="pointer-events-none absolute left-[52%] top-[8%] h-[84%] w-px" style={{ background: "rgba(111,227,194,0.07)" }} />
        <div className="pointer-events-none absolute left-[10%] top-[50%] h-px w-[84%]" style={{ background: "rgba(111,227,194,0.07)" }} />

        {/* The sweep beam + a faint counter-shimmer. */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "52%",
            top: "50%",
            width: "64vmin",
            height: "64vmin",
            translateX: "-50%",
            translateY: "-50%",
            background:
              "conic-gradient(from 0deg, rgba(111,227,194,0.26) 0deg, rgba(111,227,194,0.06) 45deg, transparent 75deg, transparent 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: anyWorking ? 4.5 : 9, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "52%",
            top: "50%",
            width: "44vmin",
            height: "44vmin",
            translateX: "-50%",
            translateY: "-50%",
            background: "conic-gradient(from 180deg, rgba(111,227,194,0.08) 0deg, transparent 30deg, transparent 360deg)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        {/* Emitter — echo waves ripple out continuously. */}
        <div className="absolute" style={{ left: "52%", top: "50%", transform: "translate(-50%, -50%)" }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full border"
              style={{ width: 18, height: 18, borderColor: SONAR, translateX: "-50%", translateY: "-50%" }}
              animate={{ scale: [1, 9], opacity: [0.5, 0] }}
              transition={{ duration: 3.4, delay: i * 1.15, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <motion.span
            className="relative block h-4 w-4 rounded-full"
            style={{ background: SONAR, boxShadow: `0 0 26px ${SONAR}` }}
            animate={anyWorking ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[11px]" style={{ color: SONAR }}>
            orchestrator
          </span>
        </div>

        {/* Contacts */}
        {AGENTS.map((a, i) => (
          <Ping
            key={a.name}
            x={POS[a.name]?.x ?? 50}
            y={POS[a.name]?.y ?? 50}
            color={a.color}
            label={a.label.toLowerCase()}
            state={agents[a.name]}
            bobDelay={i * 0.7}
          />
        ))}

        {/* Depth flavor, pinned to the table */}
        <span className="absolute right-[6%] top-[26%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−120 m</span>
        <span className="absolute right-[6%] top-[60%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−340 m</span>
        <span className="absolute right-[6%] top-[88%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−780 m</span>
      </motion.div>

      {/* Intercepted transmission — floats beside the field, retunes per agent. */}
      <div className="pointer-events-none absolute bottom-8 left-6 z-20 w-[min(24rem,44vw)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={focusName ?? "idle"}
            initial={{ opacity: 0, x: -24, rotate: -2 }}
            animate={{ opacity: 1, x: 0, rotate: -1 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg border px-4 py-3 font-mono text-[11px] backdrop-blur-md"
            style={{ borderColor: `${focusMeta?.color ?? SONAR}44`, background: "rgba(2,10,14,0.5)", backdropFilter: "blur(20px) saturate(1.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}
          >
            <div className="mb-1.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: focusMeta?.color ?? "rgba(111,227,194,0.5)" }}>
              <motion.span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: focusMeta?.color ?? SONAR_DIM }}
                animate={focusLine ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              {focusMeta ? `intercepting · ${focusMeta.label.toLowerCase()}` : "hydrophone idle"}
            </div>
            <p className="line-clamp-3 break-words leading-relaxed" style={{ color: "rgba(111,227,194,0.78)" }}>
              {focusLine ?? (anyWorking ? "listening for transmissions…" : "all contacts accounted for — surfacing the brief")}
              <motion.span
                className="ml-1 inline-block h-[10px] w-[5px] translate-y-[1px]"
                style={{ background: focusMeta?.color ?? SONAR }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
