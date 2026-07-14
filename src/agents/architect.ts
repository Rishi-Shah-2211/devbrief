import { formatFiles, formatTree, runWorker, SHARED_RULES, type WorkerSpec } from "./shared";
import type { EmitEvent, PipelineContext } from "@/orchestrator/types";

const spec: WorkerSpec = {
  name: "architect",
  workingLabel: "Mapping project structure…",
  system: `You are a senior engineer explaining a codebase's architecture to a new teammate.
Your job is to reveal how the project is organized: its main modules, layers, and how they
relate. Produce a clear structural map, not a file-by-file dump.${SHARED_RULES}`,
  buildPrompt: (ctx: PipelineContext) => `Repository: ${ctx.owner}/${ctx.repo}
Primary language: ${ctx.primaryLanguage ?? "unknown"}
Description: ${ctx.description ?? "none"}

File tree:
${formatTree(ctx.tree)}

Key files:
${formatFiles(ctx)}

Write a "Project Structure" section:
1. A short paragraph on the overall architecture and what kind of project this is.
2. An annotated map of the important directories and what each is responsible for.
3. One line on how the main pieces fit together at runtime.`,
};

export function runArchitect(ctx: PipelineContext, emit: EmitEvent) {
  return runWorker(spec, ctx, emit);
}
