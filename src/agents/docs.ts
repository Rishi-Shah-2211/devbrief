import { formatFiles, runWorker, SHARED_RULES, type WorkerSpec } from "./shared";
import type { EmitEvent, PipelineContext } from "@/orchestrator/types";

const spec: WorkerSpec = {
  name: "docs",
  workingLabel: "Reading documentation…",
  system: `You are a technical writer summarizing what a project documents about itself.
Distill the README and any docs into what actually helps someone get oriented. Carefully
separate documented intent from what the code appears to do, and flag missing docs.${SHARED_RULES}`,
  buildPrompt: (ctx: PipelineContext) => `Repository: ${ctx.owner}/${ctx.repo}
Description: ${ctx.description ?? "none"}

Documentation and source files:
${formatFiles(ctx)}

Write a "What the Project Documents" section:
1. A concise summary of what the project says it is and does.
2. How to run or use it, if documented (setup, scripts, commands).
3. A short "Documentation gaps" note listing anything important that is undocumented.`,
};

export function runDocs(ctx: PipelineContext, emit: EmitEvent) {
  return runWorker(spec, ctx, emit);
}
