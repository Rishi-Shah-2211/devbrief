import { callGroq } from "@/lib/llm/groq";
import type {
  AgentResult,
  EmitEvent,
  PipelineContext,
  WorkerName,
} from "@/orchestrator/types";

/**
 * A worker is defined declaratively: its role prompt and how it turns the repo
 * context into a task prompt. The shared runner handles the model call, event
 * emission, and citation grounding so each agent file stays focused on its role.
 */
export interface WorkerSpec {
  name: WorkerName;
  /** Human-readable status shown while the agent runs. */
  workingLabel: string;
  system: string;
  buildPrompt: (ctx: PipelineContext) => string;
}

/** Renders the file tree as an indented list, capped to keep prompts lean. */
export function formatTree(tree: string[], limit = 200): string {
  const shown = tree.slice(0, limit);
  const suffix = tree.length > limit ? `\n… and ${tree.length - limit} more files` : "";
  return shown.join("\n") + suffix;
}

/** Renders sampled file contents as labelled code blocks. */
export function formatFiles(ctx: PipelineContext): string {
  return ctx.files
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");
}

/**
 * Grounds citations in reality: rather than trusting the model to report which
 * files it used, we detect which real tree paths actually appear in its output.
 */
function extractCitations(markdown: string, tree: string[]): string[] {
  return tree.filter((path) => markdown.includes(path));
}

export async function runWorker(
  spec: WorkerSpec,
  ctx: PipelineContext,
  emit: EmitEvent,
): Promise<AgentResult> {
  emit({ agent: spec.name, status: "working", detail: spec.workingLabel });

  try {
    const { text, tokensUsed } = await callGroq({
      system: spec.system,
      prompt: spec.buildPrompt(ctx),
    });

    const result: AgentResult = {
      agent: spec.name,
      markdown: text.trim(),
      citations: extractCitations(text, ctx.tree),
      tokensUsed,
    };

    emit({ agent: spec.name, status: "done", tokensUsed });
    return result;
  } catch (error) {
    emit({
      agent: spec.name,
      status: "error",
      detail: error instanceof Error ? error.message : "Agent failed",
    });
    throw error;
  }
}

/** Shared rules appended to every worker's system prompt. */
export const SHARED_RULES = `
Rules you must follow:
- Back every factual claim with a real file path from the provided tree.
- Never invent files, folders, or features that are not in the input.
- If information is missing, say so plainly instead of guessing.
- Write for a competent developer seeing this repository for the first time.
- Be concise and scannable. Prefer short paragraphs and tight lists.
- Output GitHub-flavoured Markdown. Do not wrap the whole response in a code fence.`;
