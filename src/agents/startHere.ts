import { formatFiles, formatTree, runWorker, SHARED_RULES, type WorkerSpec } from "./shared";
import type { EmitEvent, PipelineContext } from "@/orchestrator/types";

const spec: WorkerSpec = {
  name: "startHere",
  workingLabel: "Planning a reading path…",
  system: `You are a mentor onboarding a new developer. Recommend the exact files they should
read first, in order, to build a working mental model as fast as possible. Optimize for the
shortest path to understanding — quality of ordering over quantity.${SHARED_RULES}`,
  buildPrompt: (ctx: PipelineContext) => `Repository: ${ctx.owner}/${ctx.repo}
Primary language: ${ctx.primaryLanguage ?? "unknown"}

File tree:
${formatTree(ctx.tree)}

Key files:
${formatFiles(ctx)}

Write a "Start Here" section:
An ordered list of 5 to 8 files to read first. For each: the file path (as an inline code
span) and one line on why it matters and what the reader will learn from it. Order them so
each file builds on the previous one.`,
};

export function runStartHere(ctx: PipelineContext, emit: EmitEvent) {
  return runWorker(spec, ctx, emit);
}
