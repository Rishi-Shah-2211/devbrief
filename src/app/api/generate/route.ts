import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchRepoContext, RepoFetchError } from "@/lib/github";
import { runPipeline } from "@/orchestrator";
import type { AgentEvent } from "@/orchestrator/types";

// Agent runs exceed the default edge limit; use the Node.js runtime.
export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  repoUrl: z.string().min(1, "A repository URL is required."),
});

/**
 * Runs the full onboarding pipeline for a repository and returns the brief.
 * Events are collected and returned alongside the result; Phase 6 upgrades this
 * to stream events live to the client.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const ctx = await fetchRepoContext(parsed.data.repoUrl);

    const events: AgentEvent[] = [];
    const emit = (event: Omit<AgentEvent, "ts">) => events.push({ ...event, ts: Date.now() });

    const { brief, results } = await runPipeline(ctx, emit);

    return NextResponse.json({
      repo: `${ctx.owner}/${ctx.repo}`,
      brief,
      events,
      tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
    });
  } catch (error) {
    if (error instanceof RepoFetchError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
    }
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
