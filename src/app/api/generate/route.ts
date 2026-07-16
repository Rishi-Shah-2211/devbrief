import { randomBytes } from "node:crypto";
import { z } from "zod";
import { fetchRepoContext, RepoFetchError } from "@/lib/github";
import { getGitHubToken } from "@/lib/auth";
import { computeAnalytics } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { briefs } from "@/db/schema";
import { runPipeline } from "@/orchestrator";
import type { AgentEvent, RepoAnalytics, StreamMessage } from "@/orchestrator/types";

// Agent runs exceed the default edge limit; use the Node.js runtime.
export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  repoUrl: z.string().min(1, "A repository URL is required."),
});

/**
 * Persists a finished run and returns its permalink id. Best-effort by design:
 * a missing or unreachable database costs the permalink, never the brief.
 */
async function persistBrief(input: {
  repo: string;
  description: string | null;
  brief: string;
  tokensUsed: number;
  analytics: RepoAnalytics;
}): Promise<string | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const id = `${input.repo.replace("/", "-").toLowerCase()}-${randomBytes(4).toString("hex")}`;
  try {
    await db.insert(briefs).values({ id, ...input });
    return id;
  } catch {
    return undefined;
  }
}

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

      // Heartbeat keeps proxies from idle-closing long analyses.
      const ping = setInterval(() => {
        try { send({ type: "ping" }); } catch { clearInterval(ping); }
      }, 15_000);

      const emit = (event: Omit<AgentEvent, "ts">) =>
        send({ type: "event", event: { ...event, ts: Date.now() } });

      try {
        const ctx = await fetchRepoContext(parsed.data.repoUrl, await getGitHubToken());
        const { brief, results } = await runPipeline(ctx, emit);

        const payload = {
          repo: `${ctx.owner}/${ctx.repo}`,
          description: ctx.description,
          brief,
          tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
          analytics: computeAnalytics(ctx),
        };

        send({ type: "result", ...payload, briefId: await persistBrief(payload) });
      } catch (error) {
        const message =
          error instanceof RepoFetchError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Something went wrong.";
        send({ type: "error", error: message });
      } finally {
        clearInterval(ping);
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
