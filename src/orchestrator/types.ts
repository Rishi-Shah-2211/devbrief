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
  /** Rolling tail of the text the agent is generating right now (typewriter feed). */
  preview?: string;
  tokensUsed?: number;
  ts: number;
}

export type EmitEvent = (event: Omit<AgentEvent, "ts">) => void;

/** Code-intelligence metrics computed from the repo tree — no LLM involved. */
export interface RepoAnalytics {
  totalFiles: number;
  maxDepth: number;
  /** Share of files per language, largest first. */
  languages: { name: string; files: number; pct: number }[];
  /** First-level directories by file count, largest first. */
  topDirs: { name: string; files: number }[];
  /** Names of runtime + dev dependencies, when a package.json was sampled. */
  dependencyCount: number | null;
  signals: {
    readme: boolean;
    license: boolean;
    tests: boolean;
    ci: boolean;
    docs: boolean;
    contributing: boolean;
  };
  /** Composite 0–100 score from the signals above. */
  healthScore: number;
  onboardingDifficulty: "gentle" | "moderate" | "steep";
}

/** Messages streamed from the generate endpoint to the client, newline-delimited. */
export type StreamMessage =
  | { type: "event"; event: AgentEvent }
  | {
      type: "result";
      repo: string;
      description: string | null;
      brief: string;
      tokensUsed: number;
      analytics: RepoAnalytics;
      /** Permalink id when the run was persisted; absent if the database is unavailable. */
      briefId?: string;
    }
  | { type: "error"; error: string };
