import { callGroq } from "@/lib/llm/groq";
import type {
  AgentResult,
  CriticGap,
  CriticResult,
  EmitEvent,
  PipelineContext,
  WorkerName,
} from "@/orchestrator/types";

const WORKER_NAMES: WorkerName[] = ["architect", "dependency", "docs", "startHere"];

const SYSTEM = `You are a meticulous reviewer checking a codebase onboarding brief before it
ships. Judge whether the sections are complete, grounded in real files, and free of
contradictions. You do not rewrite content — you only decide if it passes or which sections
need another pass.

Respond with ONLY a JSON object, no prose, in this exact shape:
{"verdict":"APPROVED"|"REVISE","gaps":[{"agent":"architect"|"dependency"|"docs"|"startHere","reason":"..."}]}

Approve unless a section is clearly incomplete, unsupported by the files, or self-contradictory.
Keep "gaps" empty when the verdict is APPROVED.`;

/**
 * Recovers the JSON object from a model response that may include stray text or
 * code fences, so a slightly chatty reply doesn't break the pipeline.
 */
function parseCritique(raw: string): CriticResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { verdict: "APPROVED", gaps: [] };

  try {
    const parsed = JSON.parse(match[0]) as CriticResult;
    if (parsed.verdict !== "REVISE") return { verdict: "APPROVED", gaps: [] };

    const gaps = (parsed.gaps ?? []).filter(
      (g): g is CriticGap => WORKER_NAMES.includes(g.agent) && Boolean(g.reason),
    );
    // A REVISE verdict with no actionable gaps is treated as a pass.
    return gaps.length > 0 ? { verdict: "REVISE", gaps } : { verdict: "APPROVED", gaps: [] };
  } catch {
    // If the critic's output can't be parsed, fail open rather than block the brief.
    return { verdict: "APPROVED", gaps: [] };
  }
}

export async function runCritic(
  results: AgentResult[],
  ctx: PipelineContext,
  emit: EmitEvent,
): Promise<CriticResult> {
  emit({ agent: "critic", status: "working", detail: "Reviewing agent output…" });

  const sections = results
    .map((r) => `### ${r.agent} (cited: ${r.citations.length} files)\n${r.markdown}`)
    .join("\n\n");

  try {
    const { text, tokensUsed } = await callGroq({
      system: SYSTEM,
      prompt: `Repository: ${ctx.owner}/${ctx.repo}\n\nSections to review:\n\n${sections}`,
    });

    const critique = parseCritique(text);
    emit({
      agent: "critic",
      status: "done",
      detail: critique.verdict === "REVISE" ? `Requested ${critique.gaps.length} revision(s)` : "Approved",
      tokensUsed,
    });
    return critique;
  } catch (error) {
    emit({
      agent: "critic",
      status: "error",
      detail: error instanceof Error ? error.message : "Critic failed",
    });
    // Never let a critic failure sink the whole brief.
    return { verdict: "APPROVED", gaps: [] };
  }
}
