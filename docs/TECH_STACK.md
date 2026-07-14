# Tech Stack — DevBrief

Every choice below is justified. The stack mirrors a modern production setup; **Google
Gemini is the single new addition**, introduced specifically for large-context orchestration.
The entire stack runs on free tiers.

---

## Frontend

| Tool | Why |
|------|-----|
| **Next.js 16** | App Router + Route Handlers give us server-side orchestration and streaming in one framework |
| **React 19** | Modern concurrent rendering for smooth live updates |
| **TypeScript** | End-to-end type safety across agent contracts and API events |
| **Tailwind CSS v4** | Fast, consistent styling |
| **shadcn/ui + Radix** | Accessible, composable UI primitives |
| **Framer Motion** | Drives the live agent-status animations (the visual centerpiece) |

## Data & State

| Tool | Why |
|------|-----|
| **TanStack Query** | Consumes the streaming pipeline and manages async UI state |
| **Zod** | Runtime validation of the repo URL and all agent I/O contracts |
| **Postgres (Neon)** | Free serverless Postgres for run logs and optional history |
| **Drizzle ORM** | Type-safe queries that match the TypeScript-first stack |

## AI Layer

| Tool | Why |
|------|-----|
| **Google Gemini (free tier)** | **New.** Large context window makes it ideal for whole-repo planning and final synthesis |
| **Groq · llama-3.3-70b** | Extremely fast inference for parallel worker agents; keeps latency and cost low |

**Cost-aware routing:** reasoning-heavy stages (orchestrator, synthesizer) use Gemini;
high-frequency focused stages (workers, critic) use Groq. This mirrors how real teams
balance capability against cost.

## Integration & Deployment

| Tool | Why |
|------|-----|
| **GitHub REST API** | Fetches repo tree, metadata, and file contents (public repos, no auth in v1) |
| **Vercel** | First-class Next.js hosting with free tier and edge streaming |

## Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| Gemini API | Free | $0 |
| Groq API | Free | $0 |
| Neon Postgres | Free | $0 |
| Vercel | Hobby | $0 |
| GitHub API | Public, unauthenticated | $0 |
| **Total** | | **$0** |

## Explicitly Not Used (and Why)

- **LangChain / CrewAI / LangGraph** — Orchestration here is simple enough that plain
  TypeScript (`Promise.all` + typed functions) is clearer, dependency-free, and easier to
  reason about. Choosing *not* to add a framework is a deliberate engineering signal.
- **Vector DB / RAG** — v1 works on bounded, freshly fetched repo context; retrieval
  infrastructure would be premature.
