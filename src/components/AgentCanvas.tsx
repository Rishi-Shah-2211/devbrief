"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
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

/** Directed edges of the orchestration graph, drawn as cables. */
const EDGES: { from: AgentName | "orchestrator"; to: AgentName }[] = [
  ...WORKERS.map((w) => ({ from: "orchestrator" as const, to: w.name })),
  ...WORKERS.map((w) => ({ from: w.name, to: "critic" as const })),
  { from: "critic", to: "synthesizer" },
];

type EdgeState = "idle" | "flowing" | "complete";

interface Anchor {
  key: string;
  d: string;
  state: EdgeState;
}

interface Props {
  agents: Partial<Record<AgentName, AgentState>>;
}

export function AgentCanvas({ agents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [edges, setEdges] = useState<Anchor[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const setNode = useCallback((key: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(key, el);
    else nodeRefs.current.delete(key);
  }, []);

  // Is data currently moving into `to`? Drives whether a cable is energized.
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

    const anchor = (el: HTMLElement, edge: "top" | "bottom") => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: (edge === "top" ? r.top : r.bottom) - box.top };
    };

    const next: Anchor[] = [];
    for (const e of EDGES) {
      const fromEl = nodeRefs.current.get(e.from);
      const toEl = nodeRefs.current.get(e.to);
      if (!fromEl || !toEl) continue;
      const a = anchor(fromEl, "bottom");
      const b = anchor(toEl, "top");
      const dy = Math.max(24, (b.y - a.y) * 0.5);
      next.push({
        key: `${e.from}-${e.to}`,
        d: `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`,
        state: edgeState(e.from, e.to),
      });
    }
    setEdges(next);
  }, [edgeState]);

  // Re-measure on layout, on resize, and whenever agent states change.
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const strokeFor = (s: EdgeState) =>
    s === "idle" ? "var(--color-hairline-strong)" : "var(--color-wine)";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Cable layer sits behind the windows. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        width={size.w}
        height={size.h}
        aria-hidden
      >
        <defs>
          <marker id="arrow-wine" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-wine)" />
          </marker>
          <marker id="arrow-idle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-hairline-strong)" />
          </marker>
        </defs>

        {edges.map((e) => (
          <g key={e.key}>
            {/* Base cable */}
            <path
              d={e.d}
              fill="none"
              stroke={strokeFor(e.state)}
              strokeWidth={e.state === "idle" ? 1 : 1.5}
              strokeDasharray={e.state === "idle" ? "3 5" : "none"}
              markerEnd={`url(#arrow-${e.state === "idle" ? "idle" : "wine"})`}
              opacity={e.state === "idle" ? 0.6 : 1}
            />
            {/* Flowing energy on active cables */}
            {e.state === "flowing" ? (
              <path
                className="cable-flow"
                d={e.d}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="1 23"
              />
            ) : null}
          </g>
        ))}
      </svg>

      {/* Node layer */}
      <div className="relative flex flex-col items-center gap-y-10 sm:gap-y-14">
        <AgentWindow
          ref={setNode("orchestrator")}
          meta={ORCHESTRATOR}
          variant="hub"
          state={{ status: Object.keys(agents).length > 0 ? "done" : "idle" }}
        />
        <div className="grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-4">
          {WORKERS.map((w) => (
            <AgentWindow key={w.name} ref={setNode(w.name)} meta={w} state={agents[w.name]} />
          ))}
        </div>
        <AgentWindow ref={setNode("critic")} meta={meta("critic")} variant="hub" state={agents.critic} />
        <AgentWindow ref={setNode("synthesizer")} meta={meta("synthesizer")} variant="hub" state={agents.synthesizer} />
      </div>
    </div>
  );
}
