"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AGENTS, WORKERS } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName, AgentStatus } from "@/orchestrator/types";

/**
 * Deep-sonar canvas. The repository is a dark ocean floor; the orchestrator is
 * the emitter at the center, agents surface as pings on the rings, and a sweep
 * beam circles the field. All positions are fixed percentages — nothing is
 * measured, nothing can flicker.
 */
const SONAR = "#6fe3c2";
const SONAR_DIM = "#1d5a52";

const POS: Record<string, { x: number; y: number }> = {
  architect: { x: 50, y: 20 },
  dependency: { x: 73, y: 44 },
  docs: { x: 28, y: 40 },
  startHere: { x: 39, y: 77 },
  critic: { x: 74, y: 74 },
  synthesizer: { x: 88, y: 26 },
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
      style={{ borderColor: "rgba(111,227,194,0.25)", background: "rgba(4,16,21,0.9)", color: "rgba(111,227,194,0.8)" }}
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
}: {
  x: number;
  y: number;
  color: string;
  label: string;
  state?: AgentState;
}) {
  const status: AgentStatus = state?.status ?? "idle";
  const active = status === "working";
  const dotColor = status === "idle" ? SONAR_DIM : active ? color : status === "error" ? "#ff6188" : color;

  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
      <div className="relative grid place-items-center">
        {active
          ? [0, 0.9].map((delay) => (
              <motion.span
                key={delay}
                className="absolute rounded-full border"
                style={{ borderColor: color, width: 14, height: 14 }}
                animate={{ scale: [1, 4.2], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, delay, repeat: Infinity, ease: "easeOut" }}
              />
            ))
          : null}
        <motion.span
          className="block rounded-full"
          style={{
            width: active ? 13 : 10,
            height: active ? 13 : 10,
            background: dotColor,
            boxShadow: status === "idle" ? "none" : `0 0 14px ${dotColor}`,
          }}
          animate={active ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
          transition={active ? { duration: 1.1, repeat: Infinity } : {}}
        />
      </div>
      <div
        className="absolute left-4 top-1/2 w-max -translate-y-1/2 font-mono text-[10px] leading-tight"
        style={{ color: status === "idle" ? "rgba(111,227,194,0.35)" : color }}
      >
        {label}
        <span className="ml-2 opacity-70">
          {status === "working" ? "▸ tracking" : status === "done" ? "✓" : status === "error" ? "✕ lost" : "…"}
        </span>
        {state?.tokensUsed ? (
          <span className="ml-2 opacity-50">{state.tokensUsed.toLocaleString()}t</span>
        ) : null}
      </div>
    </div>
  );
}

export function AgentCanvas({ agents }: Props) {
  const anyWorking = Object.values(agents).some((a) => a?.status === "working");

  // The log narrates whichever contact is transmitting right now.
  const focusName = (["synthesizer", "critic", ...WORKERS.map((w) => w.name)] as AgentName[]).find(
    (n) => agents[n]?.status === "working",
  );
  const focusMeta = focusName ? AGENTS.find((a) => a.name === focusName) : undefined;
  const focusLine = focusName ? agents[focusName]?.preview ?? agents[focusName]?.detail : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl"
      style={{
        background: "radial-gradient(120% 100% at 50% 30%, #082028 0%, #04121a 60%, #020a10 100%)",
        boxShadow: "inset 0 1px 0 rgba(111,227,194,0.08)",
      }}
    >
      <div className="px-4 pt-5">
        <MissionBar agents={agents} />
      </div>

      {/* The field */}
      <div className="relative flex-1">
        {/* Concentric rings, centered on the emitter. */}
        {[22, 38, 54, 70].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border"
            style={{
              left: "52%",
              top: "50%",
              width: `${r}vmin`,
              height: `${r}vmin`,
              transform: "translate(-50%, -50%)",
              borderColor: "rgba(111,227,194,0.12)",
            }}
          />
        ))}

        {/* Bearing lines + depth flavor */}
        <div className="pointer-events-none absolute left-[52%] top-0 h-full w-px" style={{ background: "rgba(111,227,194,0.06)" }} />
        <div className="pointer-events-none absolute left-0 top-[50%] h-px w-full" style={{ background: "rgba(111,227,194,0.06)" }} />
        <span className="absolute right-4 top-[24%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−120 m</span>
        <span className="absolute right-4 top-[58%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−340 m</span>
        <span className="absolute right-4 top-[86%] font-mono text-[9px]" style={{ color: "rgba(111,227,194,0.25)" }}>−780 m</span>

        {/* The sweep beam. */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "52%",
            top: "50%",
            width: "72vmin",
            height: "72vmin",
            translateX: "-50%",
            translateY: "-50%",
            background:
              "conic-gradient(from 0deg, rgba(111,227,194,0.22) 0deg, rgba(111,227,194,0.05) 40deg, transparent 70deg, transparent 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: anyWorking ? 5 : 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Emitter — the orchestrator itself. */}
        <div className="absolute" style={{ left: "52%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <motion.span
            className="block h-4 w-4 rounded-full"
            style={{ background: SONAR, boxShadow: `0 0 24px ${SONAR}` }}
            animate={anyWorking ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-mono text-[10px]" style={{ color: SONAR }}>
            orchestrator
          </span>
        </div>

        {/* Contacts */}
        {AGENTS.map((a) => (
          <Ping key={a.name} x={POS[a.name]?.x ?? 50} y={POS[a.name]?.y ?? 50} color={a.color} label={a.label.toLowerCase()} state={agents[a.name]} />
        ))}
      </div>

      {/* Sonar log — the live transmission from the active contact. */}
      <div className="border-t px-5 py-3 font-mono text-[11px]" style={{ borderColor: "rgba(111,227,194,0.15)", background: "rgba(2,10,14,0.7)" }}>
        {focusLine ? (
          <p className="truncate">
            <span style={{ color: focusMeta?.color }}>{focusMeta?.label.toLowerCase()} ▸ </span>
            <span style={{ color: "rgba(111,227,194,0.75)" }}>{focusLine}</span>
            <motion.span
              className="ml-1 inline-block h-[10px] w-[5px] translate-y-[1px]"
              style={{ background: SONAR }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </p>
        ) : (
          <p style={{ color: "rgba(111,227,194,0.4)" }}>
            {anyWorking ? "listening for transmissions…" : "all contacts accounted for — surfacing the brief"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
