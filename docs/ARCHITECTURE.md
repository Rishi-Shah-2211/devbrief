# Architecture — DevBrief

This document describes how DevBrief works internally: the orchestration model, data flow,
module layout, and the real-time streaming design.

---

## 1. High-Level Flow

```
 ┌──────────────┐   URL    ┌────────────────┐   file tree +   ┌──────────────────┐
 │   Browser    │ ───────► │  /api/generate │ ──── metadata ─►│  GitHub REST API │
 │  (Next.js)   │ ◄─────── │   (route)      │ ◄───────────────│                  │
 └──────┬───────┘  stream  └───────┬────────┘                 └──────────────────┘
        │ SSE / stream             │
        │                          ▼
        │                 ┌─────────────────┐
        │                 │  ORCHESTRATOR   │  Gemini — plans & delegates
        │                 └────────┬────────┘
        │            ┌────────┬────┴────┬─────────┐
        │            ▼        ▼         ▼         ▼    Groq workers (Promise.all)
        │        Architect  Dependency Docs   Start-Here
        │            └────────┴────┬────┴─────────┘
        │                          ▼
        │                    ┌──────────┐  gaps? re-run workers
        │                    │  CRITIC  │───────────┐
        │                    └────┬─────┘           │
        │                         ▼        ◄────────┘
        │                  ┌──────────────┐
        │                  │ SYNTHESIZER  │  merges → DevBrief.md
        │                  └──────┬───────┘
        └──── live states ◄───────┘
```

## 2. Orchestration Model

DevBrief uses **plain TypeScript orchestration** (no heavyweight agent framework) for full
control and zero extra dependencies. The orchestrator is a coordinator function, not a
long-running process.

**Pipeline stages:**

1. **Plan** — The orchestrator inspects repo metadata and decides which workers to run and
   what slice of the repo each one needs (file sampling to respect context limits).
2. **Fan-out (parallel)** — Independent workers execute concurrently via `Promise.all`.
   Each worker is a pure function: `(context) => AgentResult`.
3. **Critique** — The critic receives all worker outputs and returns either `APPROVED` or a
   list of gaps mapped to the workers that should re-run (bounded to one retry cycle).
4. **Fan-out (retry, optional)** — Only the flagged workers re-run.
5. **Synthesize** — The synthesizer merges validated outputs into one Markdown document.

**Design principle:** Each agent's every factual claim must cite a file path, so the critic
and the user can verify it. This is the primary hallucination guard.

## 3. Real-Time Streaming

The client must show agents working live. The API route streams events as the pipeline
progresses using a `ReadableStream` (Server-Sent Events style).

**Event shape:**

```ts
type AgentEvent = {
  agent: 'architect' | 'dependency' | 'docs' | 'startHere' | 'critic' | 'synthesizer';
  status: 'idle' | 'working' | 'done' | 'error';
  detail?: string;      // e.g. "Reading 12 files…"
  tokensUsed?: number;
  ts: number;
};
```

The UI keeps a state map keyed by agent and animates transitions with Framer Motion.
TanStack Query consumes the stream and updates the agent board.

## 4. Module Layout

```
src/
├── app/
│   ├── page.tsx                 # landing + repo input
│   ├── generate/page.tsx        # live agent board + result view
│   └── api/
│       └── generate/route.ts    # orchestration entry, streams AgentEvents
├── orchestrator/
│   ├── index.ts                 # runPipeline() — plan → fan-out → critique → synth
│   ├── planner.ts               # decides workers + file sampling
│   └── types.ts                 # AgentEvent, AgentResult, PipelineContext
├── agents/
│   ├── architect.ts             # project-structure map
│   ├── dependency.ts            # dependency + version analysis
│   ├── docs.ts                  # README/comment summarization
│   ├── startHere.ts             # "read these files first" tour
│   ├── critic.ts                # gap detection + retry directives
│   └── synthesizer.ts           # merges outputs → Markdown
├── components/
│   ├── AgentBoard.tsx           # grid of live AgentCards
│   ├── AgentCard.tsx            # single agent w/ animated status
│   └── BriefView.tsx            # rendered Markdown + download
└── lib/
    ├── github.ts                # REST client, file tree, file fetch, sampling
    ├── llm/gemini.ts            # orchestrator model client
    ├── llm/groq.ts              # worker model client
    └── db.ts                    # Drizzle + Neon (run logs, optional history)
```

## 5. Data Flow Contracts

- **PipelineContext** — repo metadata, sampled file list, raw file contents map.
- **AgentResult** — `{ agent, markdown, citations: string[], tokensUsed }`.
- **CriticResult** — `{ verdict: 'APPROVED' | 'REVISE', gaps: { agent, reason }[] }`.

## 6. Failure Handling

| Failure | Behavior |
|---------|----------|
| A worker throws / times out | Marked `error`; synthesizer notes the missing section |
| GitHub rate limit | Backoff + cached fetch; user sees a clear status |
| Critic requests > 1 retry cycle | Capped at one cycle to bound latency and cost |
| Gemini/Groq unavailable | Fail fast with a user-facing message; log the incident |

## 7. Why This Design Is Portfolio-Worthy

- **Parallelism** shows understanding of latency-aware system design.
- **Critic loop** shows awareness of LLM reliability and self-correction.
- **Multi-model routing** shows cost-conscious engineering judgment.
- **Streaming UI** shows full-stack skill from backend events to animated frontend.
- **Citations-first prompting** shows a serious approach to hallucination control.
