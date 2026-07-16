"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AGENTS, WORKERS, type AgentMeta } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentName } from "@/orchestrator/types";
import { AgentWindow } from "./AgentWindow";

const meta = (name: AgentName) => AGENTS.find((a) => a.name === name)!;

const ORCHESTRATOR: AgentMeta = {
  name: "orchestrator" as AgentName,
  label: "Orchestrator",
  role: "Delegates & coordinates",
  tier: "orchestrator",
};

const EDGES: { from: AgentName | "orchestrator"; to: AgentName }[] = [
  ...WORKERS.map((w) => ({ from: "orchestrator" as const, to: w.name })),
  ...WORKERS.map((w) => ({ from: w.name, to: "critic" as const })),
  { from: "critic", to: "synthesizer" },
];

type EdgeState = "idle" | "flowing" | "complete";

/**
 * Scattered constellation layout (% of the board) — deliberately off-grid so
 * the deck reads as a living network, not a diagram. Data still flows loosely
 * left → right: core, then workers strewn mid-board, critic, synthesizer.
 */
const SCATTER: Record<string, { x: number; y: number; r: number }> = {
  orchestrator: { x: 11, y: 44, r: -1.5 },
  architect: { x: 31, y: 16, r: -2 },
  dependency: { x: 35, y: 68, r: 1.5 },
  docs: { x: 53, y: 32, r: -1 },
  startHere: { x: 51, y: 82, r: 2 },
  critic: { x: 72, y: 56, r: -1.5 },
  synthesizer: { x: 89, y: 30, r: 1 },
};

interface Anchor {
  key: string;
  d: string;
  state: EdgeState;
}

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
      className="sticky top-3 z-30 mx-auto mb-8 flex w-fit items-center gap-6 rounded-full border border-[var(--color-stage-line)] bg-[rgba(8,31,35,0.92)] px-5 py-2 font-mono text-[11px] text-[rgba(244,239,232,0.65)] backdrop-blur-md"
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
      <span className="hidden text-[rgba(244,239,232,0.4)] sm:inline">drag to explore</span>
    </motion.div>
  );
}

/**
 * Mission-mode stage: a dark, immersive command deck. The pipeline runs left to
 * right — core, workers, critic, synthesizer — while a virtual camera drifts
 * toward whichever agent is working, so the viewer travels with the run.
 */
export function AgentCanvas({ agents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [edges, setEdges] = useState<Anchor[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });

  const setNode = useCallback((key: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(key, el);
    else nodeRefs.current.delete(key);
  }, []);

  const edgeState = useCallback(
    (from: string, to: AgentName): EdgeState => {
      const target = agents[to];
      const source = from === "orchestrator" ? { status: "done" } : agents[from as AgentName];
      if (target?.status === "working") return "flowing";
      if (target?.status === "done" || (source?.status === "done" && !target)) return "complete";
      if (source?.status === "done") return "complete";
      return "idle";
    },
    [agents],
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    setSize({ w: box.width, h: box.height });

    const rectOf = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - box.left, top: r.top - box.top, w: r.width, h: r.height };
    };

    const next: Anchor[] = [];
    for (const e of EDGES) {
      const fromEl = nodeRefs.current.get(e.from);
      const toEl = nodeRefs.current.get(e.to);
      if (!fromEl || !toEl) continue;
      const a = rectOf(fromEl);
      const b = rectOf(toEl);

      // Side-aware anchors: cable leaves the edge facing its target, so the
      // same code draws a horizontal deck on desktop and a stack on mobile.
      const horizontal = Math.abs(b.left - a.left) > Math.abs(b.top - a.top);
      const from = horizontal
        ? { x: a.left + a.w, y: a.top + a.h / 2 }
        : { x: a.left + a.w / 2, y: a.top + a.h };
      const to = horizontal
        ? { x: b.left, y: b.top + b.h / 2 }
        : { x: b.left + b.w / 2, y: b.top };
      const bend = horizontal
        ? `C ${from.x + Math.max(28, (to.x - from.x) * 0.5)} ${from.y}, ${to.x - Math.max(28, (to.x - from.x) * 0.5)} ${to.y},`
        : `C ${from.x} ${from.y + Math.max(24, (to.y - from.y) * 0.5)}, ${to.x} ${to.y - Math.max(24, (to.y - from.y) * 0.5)},`;

      next.push({
        key: `${e.from}-${e.to}`,
        d: `M ${from.x} ${from.y} ${bend} ${to.x} ${to.y}`,
        state: edgeState(e.from, e.to),
      });
    }
    setEdges(next);
  }, [edgeState]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // The camera drifts toward the busiest point of the pipeline.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const priority: (AgentName | "orchestrator")[] = [
      "synthesizer",
      "critic",
      ...WORKERS.map((w) => w.name),
    ];
    const focusName = priority.find((n) => agents[n as AgentName]?.status === "working");

    if (!focusName) {
      setCamera({ x: 0, y: 0, scale: 1 });
      return;
    }
    const el = nodeRefs.current.get(focusName);
    if (!el) return;

    const box = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    const cy = r.top - box.top + r.height / 2;
    const scale = 1.12;
    setCamera({
      x: (box.width / 2 - cx) * scale,
      y: (box.height / 2 - cy) * scale,
      scale,
    });
  }, [agents]);

  const strokeFor = (s: EdgeState) =>
    s === "idle" ? "var(--color-stage-line)" : "rgba(244, 239, 232, 0.45)";

  const anyWorking = Object.values(agents).some((a) => a?.status === "working");

  // Fresh jitter each run: the constellation never lands exactly the same way twice.
  const jitter = useMemo(() => {
    const m = new Map<string, { dx: number; dy: number; dr: number }>();
    for (const k of Object.keys(SCATTER)) {
      m.set(k, {
        dx: (Math.random() - 0.5) * 6,
        dy: (Math.random() - 0.5) * 9,
        dr: (Math.random() - 0.5) * 3,
      });
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scatter needs room; small screens fall back to a simple stacked column.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

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
            ref={setNode("orchestrator")}
            meta={ORCHESTRATOR}
            variant="hub"
            state={{ status: Object.keys(agents).length > 0 ? "done" : "idle" }}
          />
        </div>
      );
    }
    const worker = WORKERS.find((w) => w.name === key);
    if (worker) return <AgentWindow ref={setNode(key)} meta={worker} state={agents[key as AgentName]} />;
    return (
      <AgentWindow
        ref={setNode(key)}
        meta={meta(key as AgentName)}
        variant="hub"
        state={agents[key as AgentName]}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl px-4 py-5 sm:px-8"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, var(--color-stage) 0%, var(--color-stage-deep) 78%)",
        boxShadow: "inset 0 1px 0 rgba(244,239,232,0.08), 0 30px 80px -30px rgba(8,31,35,0.55)",
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

      {/* Camera rig */}
      <div className="flex flex-1 items-center">
      <motion.div
        className="w-full cursor-grab active:cursor-grabbing"
        drag
        dragMomentum={false}
        dragElastic={0.12}
        dragConstraints={{ left: -900, right: 900, top: -500, bottom: 500 }}
        animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div ref={containerRef} className="relative w-full">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            width={size.w}
            height={size.h}
            aria-hidden
          >
            <defs>
              <marker id="arrow-live" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="rgba(244,239,232,0.45)" />
              </marker>
              <marker id="arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--color-stage-line)" />
              </marker>
            </defs>

            {edges.map((e) => (
              <g key={e.key}>
                <path
                  d={e.d}
                  fill="none"
                  stroke={strokeFor(e.state)}
                  strokeWidth={e.state === "idle" ? 1 : 1.5}
                  strokeDasharray={e.state === "idle" ? "3 5" : "none"}
                  markerEnd={`url(#arrow-${e.state === "idle" ? "dim" : "live"})`}
                />
                {e.state === "flowing"
                  ? [0, 0.45, 0.9].map((delay) => (
                      <circle key={delay} r="3.4" fill="var(--color-gold)" opacity="0.95">
                        <animateMotion dur="1.3s" begin={`${delay}s`} repeatCount="indefinite" path={e.d} />
                      </circle>
                    ))
                  : null}
              </g>
            ))}
          </svg>

          {/* Deck: scattered constellation on wide screens, stacked column on mobile. */}
          {wide ? (
            <div className="relative h-[620px] w-full">
              {Object.entries(SCATTER).map(([key, pos]) => {
                const j = jitter.get(key)!;
                return (
                  <motion.div
                    key={key}
                    className="absolute"
                    style={{
                      left: `${pos.x + j.dx}%`,
                      top: `${pos.y + j.dy}%`,
                      translateX: "-50%",
                      translateY: "-50%",
                      rotate: pos.r + j.dr,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {windowFor(key)}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="relative flex flex-col items-center gap-10">
              {Object.keys(SCATTER).map((key) => (
                <div key={key}>{windowFor(key)}</div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
}
