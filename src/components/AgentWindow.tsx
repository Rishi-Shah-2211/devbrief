"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
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
  /** Larger treatment for the orchestrator / synthesizer hub windows. */
  variant?: "worker" | "hub";
}

/**
 * A single agent rendered as a small application window — title bar with traffic
 * lights, a status line, and a live console detail. The forwarded ref lets the
 * canvas measure the window so it can draw cables to its edges.
 */
export const AgentWindow = forwardRef<HTMLDivElement, Props>(function AgentWindow(
  { meta, state, variant = "worker" },
  ref,
) {
  const status: AgentStatus = state?.status ?? "idle";
  const color = COLOR[status];
  const active = status === "working";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: status === "idle" ? 0.72 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl border bg-[var(--color-surface-2)]"
      style={{
        borderColor: status === "idle" ? "var(--color-hairline)" : color,
        boxShadow: active
          ? `0 0 0 1px ${color}, 0 12px 40px -12px var(--color-wine-glow)`
          : "0 6px 24px -16px rgba(22,18,20,0.4)",
        width: variant === "hub" ? 232 : 210,
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: color }}
            animate={active ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
            transition={active ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
          />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-hairline-strong)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-hairline-strong)]" />
        </div>
        <span className="ml-1 truncate font-mono text-[11px] text-[var(--color-muted)]">
          {meta.name}.agent
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <span className="font-serif text-[17px] leading-none text-[var(--color-text)]">
          {meta.label}
        </span>
        <span className="text-[11px] text-[var(--color-faint)]">{meta.role}</span>

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

        {active && state?.detail ? (
          <motion.span
            key={state.detail}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="truncate font-mono text-[10px] text-[var(--color-faint)]"
          >
            {state.detail}
          </motion.span>
        ) : null}
      </div>
    </motion.div>
  );
});
