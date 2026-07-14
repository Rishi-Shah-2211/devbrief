import { formatFiles, runWorker, selectManifests, SHARED_RULES, type WorkerSpec } from "./shared";
import type { EmitEvent, PipelineContext } from "@/orchestrator/types";

const spec: WorkerSpec = {
  name: "dependency",
  workingLabel: "Analyzing dependencies…",
  system: `You are a build engineer auditing a project's dependencies. Identify the key
libraries and frameworks, what each is used for, and flag anything notable — outdated
versions, heavy or unusual choices, or potential security concerns.${SHARED_RULES}`,
  buildPrompt: (ctx: PipelineContext) => `Repository: ${ctx.owner}/${ctx.repo}

Manifest and config files:
${formatFiles(selectManifests(ctx))}

Write a "Dependencies" section:
1. A Markdown table of the most important dependencies with columns: Package | Purpose | Version.
   Group logically (framework, data, tooling) if it helps readability.
2. A short "Notes" list calling out anything a newcomer should be aware of
   (outdated versions, notable choices). If nothing stands out, say so.`,
};

export function runDependency(ctx: PipelineContext, emit: EmitEvent) {
  return runWorker(spec, ctx, emit);
}
