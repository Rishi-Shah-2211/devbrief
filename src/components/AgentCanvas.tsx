"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AGENTS, WORKERS, type AgentMeta } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName } from "@/orchestrator/types";
import { AgentWindow } from "./AgentWindow";

const metaOf = (name: AgentName) => AGENTS.find((a) => a.name === name)!;

const ORCHESTRATOR: AgentMeta = {
  name: "orchestrator" as AgentName,
  label: "Orchestrator",
  role: "Delegates & coordinates",
  tier: "orchestrator",
};

/**
 * Fixed-coordinate orbit engine. Every window and every cable is derived from
 * these constants — nothing is measured from the DOM, so cables always attach
 * and nothing can flicker under the event stream.
 */
const BOARD = { w: 1240, h: 640, cx: 500, cy: 320, r: 218 };

const POS: Record<string, { x: number; y: number }> = {
  orchestrator: { x: 150, y: 300 },
  architect: { x: 405, y: 125 },
  dependency: { x: 445, y: 480 },
  docs: { x: 665, y: 255 },
  startHere: { x: 655, y: 545 },
  critic: { x: 895, y: 150 },
  synthesizer: { x: 980, y: 440 },
};

/** Per-window resting tilt — each card floats at its own 3D attitude. */
const TILT: Record<string, { rx: number; ry: number }> = {
  orchestrator: { rx: 6, ry: -8 },
  architect: { rx: -7, ry: 6 },
  dependency: { rx: 5, ry: 9 },
  docs: { rx: -5, ry: -7 },
  startHere: { rx: 7, ry: 5 },
  critic: { rx: -6, ry: 8 },
  synthesizer: { rx: 6, ry: -6 },
};

const EDGES: { from: string; to: AgentName }[] = [
  ...WORKERS.map((w) => ({ from: "orchestrator", to: w.name })),
  ...WORKERS.map((w) => ({ from: w.name, to: "critic" as const })),
  { from: "critic", to: "synthesizer" },
];

type EdgeState = "idle" | "flowing" | "complete";

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

/** Elapsed run time + live token meter + fleet progress — the mission strip. */
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
      className="sticky top-3 z-30 mx-auto mb-6 flex w-fit items-center gap-6 rounded-full border border-[var(--color-stage-line)] bg-[rgba(22,22,30,0.92)] px-5 py-2 font-mono text-[11px] text-[rgba(192,202,245,0.65)] backdrop-blur-md"
    >
      <span className="flex items-center gap-1.5">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]"
          animate={finished ? {} : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {finished ? "COMPLETE" : "LIVE"}
      </span>
      <span>
        T+{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
      </span>
      <span className="text-[var(--color-gold)]">{tokens.toLocaleString()} tokens</span>
      <span>{done}/6 agents</span>
      <span className="hidden text-[rgba(192,202,245,0.4)] sm:inline">drag to explore</span>
    </motion.div>
  );
}

export function AgentCanvas({ agents }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.8);
  const [wide, setWide] = useState(false);

  // One cheap observer scales the whole board to the container width.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      setFit(Math.min(1, el.clientWidth / BOARD.w));
      setWide(window.innerWidth >= 1024);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const edgeState = (from: string, to: AgentName): EdgeState => {
    const target = agents[to];
    const source = from === "orchestrator" ? { status: "done" } : agents[from as AgentName];
    if (target?.status === "working") return "flowing";
    if (target?.status === "done") return "complete";
    if (source?.status === "done") return "complete";
    return "idle";
  };

  // Camera drifts toward the busiest agent — pure math on fixed coordinates.
  const priority = ["synthesizer", "critic", ...WORKERS.map((w) => w.name)] as AgentName[];
  const focus = priority.find((n) => agents[n]?.status === "working");
  const zoom = focus ? 1.18 : 1;
  const cam = focus
    ? { x: (BOARD.w / 2 - POS[focus].x) * zoom, y: (BOARD.h / 2 - POS[focus].y) * zoom }
    : { x: 0, y: 0 };

  const anyWorking = Object.values(agents).some((a) => a?.status === "working");

  const windowFor = (key: string) => {
    if (key === "orchestrator") {
      return (
        <div className="relative">
          {anyWorking ? (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[var(--color-gold)]"
              animate={{ scale: [1, 1.16], opacity: [0.45, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <AgentWindow
            meta={ORCHESTRATOR}
            variant="hub"
            state={{ status: Object.keys(agents).length > 0 ? "done" : "idle" }}
          />
        </div>
      );
    }
    const worker = WORKERS.find((w) => w.name === key);
    if (worker) return <AgentWindow meta={worker} state={agents[key as AgentName]} />;
    return <AgentWindow meta={metaOf(key as AgentName)} variant="hub" state={agents[key as AgentName]} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl px-2 py-5 sm:px-4"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, var(--color-stage) 0%, var(--color-stage-deep) 78%)",
        boxShadow: "inset 0 1px 0 rgba(192,202,245,0.08), 0 30px 80px -30px rgba(22,22,30,0.55)",
      }}
    >
      {/* Faint grid — the deck floor. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-stage-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-stage-line) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <MissionBar agents={agents} />

      <div ref={outerRef} className="flex flex-1 items-center justify-center">
        {wide ? (
          <div style={{ width: BOARD.w * fit, height: BOARD.h * fit }}>
            <motion.div
              className="relative cursor-grab active:cursor-grabbing"
              style={{ width: BOARD.w, height: BOARD.h, scale: fit, transformOrigin: "top left" }}
              drag
              dragMomentum={false}
              dragElastic={0.12}
              dragConstraints={{ left: -700, right: 700, top: -400, bottom: 400 }}
              animate={{ x: cam.x * fit, y: cam.y * fit, scale: fit * zoom }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Cables: pure geometry, drawn center-to-center beneath the windows. */}
              <svg className="pointer-events-none absolute inset-0" width={BOARD.w} height={BOARD.h} aria-hidden>
                <defs>
                  <marker id="arr-live" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="rgba(192,202,245,0.55)" />
                  </marker>
                  <marker id="arr-dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="var(--color-stage-line)" />
                  </marker>
                </defs>

                {/* Decorative orbit ring, slowly rotating. */}
                <g style={{ transformOrigin: `${BOARD.cx}px ${BOARD.cy}px`, animation: "spin 60s linear infinite" }}>
                  <circle
                    cx={BOARD.cx}
                    cy={BOARD.cy}
                    r={BOARD.r}
                    fill="none"
                    stroke="var(--color-stage-line)"
                    strokeDasharray="4 10"
                  />
                </g>

                {EDGES.map((e) => {
                  const a = POS[e.from];
                  const b = POS[e.to];
                  const mx = (a.x + b.x) / 2;
                  const my = (a.y + b.y) / 2;
                  const st = edgeState(e.from, e.to);
                  const d = `M ${a.x} ${a.y} L ${mx} ${my} L ${b.x} ${b.y}`;
                  return (
                    <g key={`${e.from}-${e.to}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke={st === "idle" ? "var(--color-stage-line)" : "rgba(192,202,245,0.4)"}
                        strokeWidth={st === "idle" ? 1 : 1.5}
                        strokeDasharray={st === "idle" ? "3 6" : "none"}
                        markerMid={`url(#${st === "idle" ? "arr-dim" : "arr-live"})`}
                      />
                      {st === "flowing"
                        ? [0, 0.45, 0.9].map((delay) => (
                            <circle key={delay} r="3.6" fill="var(--color-gold)" opacity="0.95">
                              <animateMotion dur="1.3s" begin={`${delay}s`} repeatCount="indefinite" path={d} />
                            </circle>
                          ))
                        : null}
                    </g>
                  );
                })}
              </svg>

              {Object.entries(POS).map(([key, pos]) => {
                const st = agents[key as AgentName]?.status;
                const t = TILT[key];
                const activeCard = st === "working";
                return (
                  <div
                    key={key}
                    className="absolute"
                    style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)", perspective: 1200 }}
                  >
                    <motion.div
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{
                        rotateX: activeCard ? 0 : t.rx,
                        rotateY: activeCard ? 0 : t.ry,
                        scale: activeCard ? 1.08 : 0.92,
                        y: activeCard ? 0 : [0, -7, 0],
                      }}
                      transition={
                        activeCard
                          ? { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                          : { rotateX: { duration: 0.7 }, rotateY: { duration: 0.7 }, scale: { duration: 0.7 }, y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } }
                      }
                    >
                      {windowFor(key)}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        ) : (
          <div className="relative flex w-full flex-col items-center gap-10 py-4">
            {Object.keys(POS).map((key) => (
              <div key={key}>{windowFor(key)}</div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}
