import { callGemini } from "@/lib/llm/gemini";
import type { AgentResult, EmitEvent, PipelineContext } from "@/orchestrator/types";

const SYSTEM = `You are the editor assembling a final codebase onboarding brief from sections
written by specialist agents. Merge them into one cohesive document with a consistent voice.
Remove duplication, order the sections logically, and keep every cited file path intact. Do
not add new claims that the sections do not support.`;

/** Fixed section order gives every generated brief a predictable, professional shape. */
const SECTION_ORDER = ["docs", "architect", "dependency", "startHere"] as const;

export async function runSynthesizer(
  results: AgentResult[],
  ctx: PipelineContext,
  emit: EmitEvent,
): Promise<string> {
  emit({ agent: "synthesizer", status: "working", detail: "Assembling the brief…" });

  const ordered = [...results].sort(
    (a, b) => SECTION_ORDER.indexOf(a.agent) - SECTION_ORDER.indexOf(b.agent),
  );
  const body = ordered.map((r) => r.markdown).join("\n\n");

  const prompt = `Repository: ${ctx.owner}/${ctx.repo}
Description: ${ctx.description ?? "none"}

Combine the sections below into a single onboarding brief titled "# ${ctx.repo} — Onboarding Brief".
Open with a two-sentence overview of what the project is, then present the sections in a
natural reading order. Keep it tight and skimmable.

Sections:
${body}`;

  try {
    const { text, tokensUsed } = await callGemini({ system: SYSTEM, prompt, temperature: 0.35 });
    emit({ agent: "synthesizer", status: "done", tokensUsed });
    return text.trim();
  } catch (error) {
    emit({
      agent: "synthesizer",
      status: "error",
      detail: error instanceof Error ? error.message : "Synthesis failed",
    });
    throw error;
  }
}
