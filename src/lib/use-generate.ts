"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AgentEvent,
  AgentName,
  AgentStatus,
  RepoAnalytics,
  StreamMessage,
} from "@/orchestrator/types";

export type Phase = "idle" | "running" | "done" | "error";

export interface AgentState {
  status: AgentStatus;
  detail?: string;
  /** Rolling tail of the agent's live output (typewriter feed). */
  preview?: string;
  tokensUsed?: number;
}

export interface GenerateResult {
  repo: string;
  description: string | null;
  brief: string;
  tokensUsed: number;
  analytics: RepoAnalytics;
  briefId?: string;
}

type AgentStates = Partial<Record<AgentName, AgentState>>;

/**
 * Drives a generation run: POSTs the repo URL, reads the newline-delimited
 * event stream, and exposes live per-agent state plus the final brief.
 */
export function useGenerate() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [agents, setAgents] = useState<AgentStates>({});
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case "event": {
        const { agent, status, detail, preview, tokensUsed } = message.event as AgentEvent;
        setAgents((prev) => ({
          ...prev,
          // Merge so a preview-only tick doesn't wipe the detail line (and vice versa).
          [agent]: {
            ...prev[agent],
            status,
            detail: detail ?? prev[agent]?.detail,
            preview: preview ?? (status === "working" ? prev[agent]?.preview : undefined),
            tokensUsed: tokensUsed ?? prev[agent]?.tokensUsed,
          },
        }));
        break;
      }
      case "result":
        setResult({
          repo: message.repo,
          description: message.description,
          brief: message.brief,
          tokensUsed: message.tokensUsed,
          analytics: message.analytics,
          briefId: message.briefId,
        });
        setPhase("done");
        break;
      case "error":
        setError(message.error);
        setPhase("error");
        break;
    }
  }, []);

  const start = useCallback(
    async (repoUrl: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase("running");
      setAgents({});
      setResult(null);
      setError(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({ error: "Request failed." }));
          setError(data.error ?? "Request failed.");
          setPhase("error");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // NDJSON: accumulate bytes and apply each complete line as it arrives.
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newline: number;
          while ((newline = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line) apply(JSON.parse(line) as StreamMessage);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Connection failed.");
        setPhase("error");
      }
    },
    [apply],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setAgents({});
    setResult(null);
    setError(null);
  }, []);

  return { phase, agents, result, error, start, reset };
}
