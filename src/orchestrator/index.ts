import { runArchitect } from "@/agents/architect";
import { runDependency } from "@/agents/dependency";
import { runDocs } from "@/agents/docs";
import { runStartHere } from "@/agents/startHere";
import { runCritic } from "@/agents/critic";
import { runSynthesizer } from "@/agents/synthesizer";
import type {
  AgentResult,
  EmitEvent,
  PipelineContext,
  WorkerName,
} from "./types";

/** Maps each worker to its runner so the orchestrator can invoke them by name. */
const WORKERS: Record<WorkerName, (ctx: PipelineContext, emit: EmitEvent) => Promise<AgentResult>> = {
  architect: runArchitect,
  dependency: runDependency,
  docs: runDocs,
  startHere: runStartHere,
};

const ALL_WORKERS = Object.keys(WORKERS) as WorkerName[];

export interface PipelineOutput {
  brief: string;
  results: AgentResult[];
}

/** Runs the named workers concurrently and collects their results. */
async function runWorkers(
  names: WorkerName[],
  ctx: PipelineContext,
  emit: EmitEvent,
): Promise<AgentResult[]> {
  return Promise.all(names.map((name) => WORKERS[name](ctx, emit)));
}

/**
 * Orchestrates the full onboarding pipeline:
 *   1. Fan out all workers in parallel.
 *   2. Run the critic; if it flags gaps, re-run only those workers once.
 *   3. Synthesize the validated sections into the final brief.
 *
 * A single bounded retry keeps latency and cost predictable while still giving
 * the pipeline a chance to self-correct.
 */
export async function runPipeline(
  ctx: PipelineContext,
  emit: EmitEvent,
): Promise<PipelineOutput> {
  // 1. Fan out.
  let results = await runWorkers(ALL_WORKERS, ctx, emit);

  // 2. Critique, then re-run only the flagged workers (one cycle).
  const critique = await runCritic(results, ctx, emit);

  if (critique.verdict === "REVISE") {
    const toRetry = [...new Set(critique.gaps.map((g) => g.agent))];
    const revised = await runWorkers(toRetry, ctx, emit);
    const byName = new Map(revised.map((r) => [r.agent, r]));
    results = results.map((r) => byName.get(r.agent) ?? r);
  }

  // 3. Synthesize.
  const brief = await runSynthesizer(results, ctx, emit);

  return { brief, results };
}
