<div align="center">

# 🧠 DevBrief

### AI Agent Orchestration for Instant Codebase Onboarding

**Paste a GitHub repository URL → five specialized AI agents analyze it in parallel → receive a recruiter-grade onboarding brief in under a minute.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-Orchestrator-8e75ff)](https://ai.google.dev)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-f55036)](https://groq.com)

[Live Demo](#) · [Documentation](docs/) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## The Problem

Every developer who joins a new team loses days navigating an unfamiliar codebase — mapping folders, tracing dependencies, and hunting for where to start. This onboarding tax is invisible but expensive.

## The Solution

**DevBrief** treats codebase onboarding as a multi-agent orchestration problem. A central **orchestrator** decomposes the task and delegates it to specialized worker agents that run **in parallel**. A **critic** agent enforces quality through a feedback loop, and a **synthesizer** merges everything into a single, coherent onboarding document — with the entire agent pipeline visualized **live** in the UI.

This project demonstrates production patterns that matter in real AI engineering: **parallel agent execution, role-specialized prompting, critic-based self-correction, streaming state to the client, and cost-aware multi-model routing.**

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **5-agent orchestration** | Architect · Dependency · Docs · Start-Here workers, coordinated by an orchestrator |
| ⚡ **Parallel execution** | Independent agents run concurrently, cutting end-to-end latency |
| 🔁 **Critic feedback loop** | A reviewer agent detects gaps and re-triggers workers before finalizing |
| 🎬 **Live agent visualization** | Real-time agent states (`idle → working → done`) streamed to an animated UI |
| 🎯 **Cost-aware model routing** | Reasoning-heavy orchestration on Gemini; fast, cheap worker calls on Groq |
| 📄 **Portable output** | Exports a clean, shareable `DevBrief.md` onboarding document |

---

## Architecture at a Glance

```
          GitHub Repo URL
                │
        ┌───────▼────────┐
        │  ORCHESTRATOR  │   Gemini · decomposes & delegates
        └───────┬────────┘
     ┌──────┬───┴───┬──────┐
     ▼      ▼       ▼      ▼        Groq · run in parallel
 Architect  Dep   Docs  Start-Here
     └──────┴───┬───┴──────┘
                ▼
           ┌─────────┐   re-run on gaps
           │ CRITIC  │──────────┐
           └────┬────┘          │
                ▼          ◄─────┘
          ┌────────────┐
          │ SYNTHESIZER│   merges into one brief
          └─────┬──────┘
                ▼
          DevBrief.md  ✅
```

Full data flow and rationale: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## Tech Stack

Built on a modern, production-grade stack. Google Gemini is the single new addition, introduced specifically to handle large-context orchestration.

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix, Framer Motion
- **Data & State:** TanStack Query, Zod, Postgres (Neon), Drizzle ORM
- **AI:** Google Gemini (orchestrator), Groq · llama-3.3-70b (workers)
- **Integration:** GitHub REST API
- **Deployment:** Vercel

Detailed rationale for every choice: **[docs/TECH_STACK.md](docs/TECH_STACK.md)**

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
#   GEMINI_API_KEY   — free at https://ai.google.dev
#   GROQ_API_KEY     — free at https://console.groq.com
#   DATABASE_URL     — free Postgres at https://neon.tech

# 3. Run
pnpm dev
```

---

## Documentation

| Document | Contents |
|----------|----------|
| [PRD.md](docs/PRD.md) | Product vision, target users, scope, success metrics |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, orchestration model |
| [AGENTS.md](docs/AGENTS.md) | Each agent's role, I/O contract, and prompt strategy |
| [TECH_STACK.md](docs/TECH_STACK.md) | Full stack with justification for each choice |
| [ROADMAP.md](docs/ROADMAP.md) | Phased build plan from MVP to polish |

---

## Author

**Rishi Shah** — Full-stack & AI engineer
Masters in Business Analytics & AI, Ontario Tech University
🔗 [portfolio-rhs.vercel.app](https://portfolio-rhs.vercel.app)

<div align="center"><sub>Built to demonstrate real-world multi-agent orchestration, not a toy demo.</sub></div>
