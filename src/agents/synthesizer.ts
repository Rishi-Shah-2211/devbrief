import { callSynthLLM } from "@/lib/llm/providers";
import type { AgentResult, EmitEvent, PipelineContext } from "@/orchestrator/types";

const SYSTEM = `You are the editor assembling a final codebase onboarding brief from sections
written by specialist agents. Merge them into one cohesive document with a consistent voice.
Remove duplication and keep every cited file path intact. Do not add new claims that the
sections do not support.

STRUCTURE IS NON-NEGOTIABLE. The document must follow this exact skeleton, and no section
may be a wall of prose — every section uses the compact form specified for it:

# <repo> — Onboarding Brief
> One-sentence verdict on what this project is.

## At a glance
A markdown table with exactly these rows: Purpose | Language | Entry point | How to run.

## What it does
Maximum two short paragraphs.

## Project structure
A bulleted map: each bullet = \`path\` — role (one line each, 5–8 bullets).

## Dependencies
A markdown table: Package | Purpose | Version. Then a "Notes" list of at most 3 bullets.

## Start here
A numbered list: \`file path\` — one-line reason. 5–8 items, reading order.

## Watch out for
3–5 bullets of gotchas or gaps. If none were reported, a single line saying so.`;

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

  let lastPreview = 0;
  const onDelta = (textSoFar: string) => {
    const now = Date.now();
    if (now - lastPreview < 150) return;
    lastPreview = now;
    emit({ agent: "synthesizer", status: "working", preview: textSoFar.slice(-160) });
  };

  try {
    // The provider layer walks its own fallback chain (OpenRouter → Cerebras → Groq).
    const { text, tokensUsed, provider } = await callSynthLLM({
      system: SYSTEM,
      prompt,
      temperature: 0.35,
      onDelta,
    });
    emit({ agent: "synthesizer", status: "done", detail: `via ${provider}`, tokensUsed });
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
