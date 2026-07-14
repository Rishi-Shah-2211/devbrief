# Roadmap — DevBrief

A phased build plan from a working MVP to a polished, portfolio-ready product. Phases are
ordered so there is always a demoable result at the end of each.

---

## Phase 0 — Foundation
- Scaffold Next.js 16 + TypeScript + Tailwind v4 project.
- Add shadcn/ui, Framer Motion, TanStack Query, Zod.
- Set up `.env.example`, LLM clients (Gemini, Groq), and Neon + Drizzle.
- **Deliverable:** App runs locally; API keys wired; empty pipeline stub returns mock events.

## Phase 1 — GitHub Ingestion
- Validate repo URL (Zod) and fetch metadata + file tree via GitHub REST API.
- Implement file sampling (respect context limits, prioritize entry points).
- **Deliverable:** Given a URL, the app fetches and displays the sampled file list.

## Phase 2 — Single Agent (vertical slice)
- Build the Architect worker end-to-end (Groq call → `AgentResult` with citations).
- Render its Markdown output.
- **Deliverable:** One real agent produces a real structural map for any public repo.

## Phase 3 — Full Worker Set + Parallelism
- Implement Dependency, Docs, and Start-Here workers.
- Run all four concurrently with `Promise.all` in the orchestrator.
- **Deliverable:** All four sections generate in parallel.

## Phase 4 — Orchestrator + Critic Loop
- Add the planner (worker selection + file assignment) on Gemini.
- Add the critic pass with a single bounded retry cycle.
- **Deliverable:** Pipeline self-corrects gaps before finalizing.

## Phase 5 — Synthesizer + Export
- Merge validated outputs into one coherent `DevBrief.md` (Gemini).
- Add download + copy-to-clipboard.
- **Deliverable:** A complete, shareable onboarding brief.

## Phase 6 — Live Agent Visualization ⭐
- Stream `AgentEvent`s from the API route (ReadableStream / SSE).
- Build the animated AgentBoard: cards transition `idle → working → done` with Framer Motion.
- Show per-agent detail (files read, tokens used).
- **Deliverable:** The signature live, cinematic agent pipeline view.

## Phase 7 — Polish & Ship
- Error states, empty states, rate-limit handling, loading skeletons.
- Responsive + accessibility (WCAG AA contrast, keyboard nav).
- Landing page copy, demo GIF, deploy to Vercel.
- Write a strong README case study for recruiters.
- **Deliverable:** Public live demo + polished repo.

## Stretch (v2)
- Private repos via GitHub OAuth.
- Persisted history + shareable brief links.
- Follow-up chat over the generated brief.
- AST-level language-aware analysis.

---

### Suggested Build Order Rationale
Each phase produces something demoable, so the project is never in a broken half-state — and
if time runs short before job applications, **Phases 0–3 alone already make an impressive
demo.** The live visualization (Phase 6) is the visual hook that makes it memorable to
recruiters, so it is prioritized as its own dedicated phase rather than an afterthought.
