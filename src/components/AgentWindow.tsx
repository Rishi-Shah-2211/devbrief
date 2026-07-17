"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentMeta } from "@/lib/agents-meta";
import type { AgentState } from "@/lib/use-generate";
import type { AgentStatus } from "@/orchestrator/types";

const COLOR: Record<AgentStatus, string> = {
  idle: "var(--color-faint)",
  working: "var(--color-working)",
  done: "var(--color-done)",
  error: "var(--color-error)",
};

const LABEL: Record<AgentStatus, string> = {
  idle: "idle",
  working: "running",
  done: "done",
  error: "failed",
};

interface Props {
  meta: AgentMeta;
  state?: AgentState;
  /** Larger treatment for the orchestrator / critic / synthesizer hub windows. */
  variant?: "worker" | "hub";
}

/** Eight dots radiating outward once — fired the moment an agent completes. */
function CompletionBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-done)" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 54,
              y: Math.sin(angle) * 54,
              opacity: 0,
              scale: 0.4,
            }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

/**
 * A single agent rendered as a small application window — title bar with traffic
 * lights, a status line, and a live console streaming what the agent is writing.
 * The forwarded ref lets the canvas draw cables to the window's edges.
 */
export const AgentWindow = forwardRef<HTMLDivElement, Props>(function AgentWindow(
  { meta, state, variant = "worker" },
  ref,
) {
  const status: AgentStatus = state?.status ?? "idle";
  const color = COLOR[status];
  const active = status === "working";

  // Fire the particle burst exactly once per working → done transition.
  const prevStatus = useRef(status);
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    if (prevStatus.current === "working" && status === "done") {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 700);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);
  useEffect(() => {
    prevStatus.current = status;
  }, [status]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: status === "idle" ? 0.68 : 1,
        y: 0,
        scale: active ? 1.03 : 1,
      }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-visible rounded-xl border bg-[rgba(252,252,250,0.04)] backdrop-blur-sm"
      style={{
        borderColor: status === "idle" ? "var(--color-stage-line)" : status === "working" ? meta.color : color,
        boxShadow: active
          ? `0 0 0 1.5px ${meta.color}, 0 20px 48px -12px ${meta.color}55`
          : "0 8px 30px -14px rgba(0,0,0,0.6)",
        width: variant === "hub" ? 204 : 186,
        zIndex: active ? 2 : 1,
      }}
    >
      {burst ? <CompletionBurst /> : null}

      <div className="overflow-hidden rounded-xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[var(--color-stage-line)] bg-[rgba(25,24,26,0.55)] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <motion.span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
              animate={active ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
              transition={active ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
            />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(252,252,250,0.18)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(252,252,250,0.18)]" />
          </div>
          <span className="ml-1 truncate font-mono text-[11px]" style={{ color: meta.color }}>
            {meta.name}.agent
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1 px-3 py-2.5">
          <span className="font-serif text-[17px] leading-none text-[#fcfcfa]">
            {meta.label}
          </span>
          <span className="text-[11px] text-[rgba(252,252,250,0.45)]">{meta.role}</span>

          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
              ● {LABEL[status]}
            </span>
            {state?.tokensUsed ? (
              <span className="font-mono text-[9px] text-[var(--color-faint)]">
                {state.tokensUsed.toLocaleString()}t
              </span>
            ) : null}
          </div>

          {/* Live console: the agent's actual output, streaming in. */}
          <AnimatePresence>
            {active ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 rounded-md border border-[var(--color-stage-line)] bg-[var(--color-stage-deep)] px-2 py-1.5">
                  <p className="line-clamp-2 break-all font-mono text-[9px] leading-[1.5] text-[#c1c0c0]">
                    {state?.preview ?? state?.detail ?? "…"}
                    <motion.span
                      className="ml-0.5 inline-block h-[9px] w-[5px] translate-y-[1px] bg-[var(--color-gold)]"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});
