import type { AgentName } from "@/orchestrator/types";

export interface AgentMeta {
  name: AgentName;
  label: string;
  role: string;
  /** The agent's own Monokai token color - every hue in the palette gets a job. */
  color: string;
  /** Pipeline tier, used to lay the graph out top to bottom. */
  tier: "orchestrator" | "worker" | "critic" | "synthesizer";
}

/**
 * UI-facing description of every agent. The orchestrator has no model call of
 * its own yet, but appears in the graph as the coordinating root node.
 */
export const AGENTS: AgentMeta[] = [
  { name: "architect", label: "Architect", role: "Maps project structure", tier: "worker", color: "#ab9df2" },
  { name: "dependency", label: "Dependency", role: "Audits libraries", tier: "worker", color: "#78dce8" },
  { name: "docs", label: "Docs", role: "Summarizes documentation", tier: "worker", color: "#a9dc76" },
  { name: "startHere", label: "Start Here", role: "Plans a reading path", tier: "worker", color: "#fc9867" },
  { name: "critic", label: "Critic", role: "Reviews for gaps", tier: "critic", color: "#ff6188" },
  { name: "synthesizer", label: "Synthesizer", role: "Assembles the brief", tier: "synthesizer", color: "#ffd866" },
];

export const WORKERS = AGENTS.filter((a) => a.tier === "worker");
