import { z } from "zod";
import { fetchRepoContext, RepoFetchError } from "@/lib/github";
import { computeAnalytics } from "@/lib/analytics";
import { runPipeline } from "@/orchestrator";
import type { AgentEvent, StreamMessage } from "@/orchestrator/types";

// Agent runs exceed the default edge limit; use the Node.js runtime.
export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  repoUrl: z.string().min(1, "A repository URL is required."),
});

/**
 * Streams the onboarding pipeline as newline-delimited JSON so the client can
 * animate each agent's progress live. Every agent event is flushed the moment
 * it happens; a final "result" (or "error") message closes the stream.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (message: StreamMessage) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`));

      const emit = (event: Omit<AgentEvent, "ts">) =>
        send({ type: "event", event: { ...event, ts: Date.now() } });

      try {
        const ctx = await fetchRepoContext(parsed.data.repoUrl);
        const { brief, results } = await runPipeline(ctx, emit);

        send({
          type: "result",
          repo: `${ctx.owner}/${ctx.repo}`,
          description: ctx.description,
          brief,
          tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
          analytics: computeAnalytics(ctx),
        });
      } catch (error) {
        const message =
          error instanceof RepoFetchError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Something went wrong.";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
