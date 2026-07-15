import { z } from "zod";
import { fetchRepoContext, RepoFetchError } from "@/lib/github";
import { callWorkerLLM } from "@/lib/llm/providers";
import type { PipelineContext } from "@/orchestrator/types";
import { formatFiles, formatTree } from "@/agents/shared";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Expected owner/repo."),
  question: z.string().min(1).max(2000),
  /** The generated brief, sent from the client so answers stay consistent with it. */
  brief: z.string().max(40_000),
});

/**
 * Repo context cache. Chat sessions ask several questions in a row; re-fetching
 * the tree and files from GitHub for each one would burn the unauthenticated
 * rate limit. Warm serverless instances share this map between questions.
 */
const contextCache = new Map<string, { ctx: PipelineContext; at: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function getContext(repo: string): Promise<PipelineContext> {
  const cached = contextCache.get(repo);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.ctx;
  const ctx = await fetchRepoContext(`https://github.com/${repo}`);
  contextCache.set(repo, { ctx, at: Date.now() });
  return ctx;
}

const SYSTEM = `You are DevBrief's repository guide. Answer questions about the repository
using ONLY the provided brief, file tree, and file contents. Ground every claim in a real
file path when possible. If the provided material doesn't contain the answer, say so
plainly and suggest which file the reader should check. Be concise and practical — you are
helping a developer get productive. Output GitHub-flavoured Markdown.`;

/** Streams a plain-text answer so the client can render it as it arrives. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { repo, question, brief } = parsed.data;

  let ctx: PipelineContext;
  try {
    ctx = await getContext(repo);
  } catch (error) {
    const message = error instanceof RepoFetchError ? error.message : "Could not load the repository.";
    return Response.json({ error: message }, { status: 502 });
  }

  const prompt = `Repository: ${repo}

Onboarding brief (already generated):
${brief}

File tree:
${formatTree(ctx.tree)}

Key file contents:
${formatFiles(ctx.files.slice(0, 8))}

Question: ${question}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = 0;
      try {
        const { text } = await callWorkerLLM({
          system: SYSTEM,
          prompt,
          temperature: 0.2,
          onDelta: (textSoFar) => {
            controller.enqueue(encoder.encode(textSoFar.slice(sent)));
            sent = textSoFar.length;
          },
        });
        // Flush anything the throttle didn't deliver.
        if (text.length > sent) controller.enqueue(encoder.encode(text.slice(sent)));
      } catch {
        controller.enqueue(encoder.encode("\n\n_The model is briefly unavailable — please try again._"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
