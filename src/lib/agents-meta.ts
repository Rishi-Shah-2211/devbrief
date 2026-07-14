import type { AgentName } from "@/orchestrator/types";

export interface AgentMeta {
  name: AgentName;
  label: string;
  role: string;
  /** Pipeline tier, used to lay the graph out top to bottom. */
  tier: "orchestrator" | "worker" | "critic" | "synthesizer";
}

/**
 * UI-facing description of every agent. The orchestrator has no model call of
 * its own yet, but appears in the graph as the coordinating root node.
 */
export const AGENTS: AgentMeta[] = [
  { name: "architect", label: "Architect", role: "Maps project structure", tier: "worker" },
  { name: "dependency", label: "Dependency", role: "Audits libraries", tier: "worker" },
  { name: "docs", label: "Docs", role: "Summarizes documentation", tier: "worker" },
  { name: "startHere", label: "Start Here", role: "Plans a reading path", tier: "worker" },
  { name: "critic", label: "Critic", role: "Reviews for gaps", tier: "critic" },
  { name: "synthesizer", label: "Synthesizer", role: "Assembles the brief", tier: "synthesizer" },
];

export const WORKERS = AGENTS.filter((a) => a.tier === "worker");
