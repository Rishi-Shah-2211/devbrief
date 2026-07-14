/**
 * Shared contracts for the agent pipeline. Every stage — orchestrator, workers,
 * critic, synthesizer — communicates through these types, so the whole pipeline
 * stays type-checked end to end.
 */

export type WorkerName = "architect" | "dependency" | "docs" | "startHere";

export type AgentName = WorkerName | "critic" | "synthesizer";

export type AgentStatus = "idle" | "working" | "done" | "error";

/** A single file pulled from the target repository. */
export interface RepoFile {
  path: string;
  content: string;
}

/** Everything the pipeline knows about the target repository. */
export interface PipelineContext {
  owner: string;
  repo: string;
  description: string | null;
  primaryLanguage: string | null;
  /** Flat list of every path in the tree (used for structural reasoning). */
  tree: string[];
  /** Contents of the files the planner chose to sample. */
  files: RepoFile[];
}

/** Output of one worker agent. Claims must be backed by cited file paths. */
export interface AgentResult {
  agent: WorkerName;
  markdown: string;
  citations: string[];
  tokensUsed: number;
}

export interface CriticGap {
  agent: WorkerName;
  reason: string;
}

export interface CriticResult {
  verdict: "APPROVED" | "REVISE";
  gaps: CriticGap[];
}

/** Streamed to the client so the UI can animate live agent progress. */
export interface AgentEvent {
  agent: AgentName;
  status: AgentStatus;
  detail?: string;
  tokensUsed?: number;
  ts: number;
}

export type EmitEvent = (event: Omit<AgentEvent, "ts">) => void;

/** Messages streamed from the generate endpoint to the client, newline-delimited. */
export type StreamMessage =
  | { type: "event"; event: AgentEvent }
  | { type: "result"; repo: string; brief: string; tokensUsed: number }
  | { type: "error"; error: string };
