# Roadmap v2 — DevBrief as a Product

The v1 MVP proved the multi-agent pipeline end to end. v2 turns it into a polished,
multi-page product with real analytics, a cinematic experience, and reliability that holds
up in front of recruiters. Built phase by phase; each phase ships something demoable.

---

## Phase 1 — Multi-Page Architecture & Premium Landing
- App Router routes: `/` (marketing), `/analyze` (tool), `/showcase`, `/how-it-works`.
- Shared site chrome: sticky nav, footer, page-transition animations.
- Cinematic marketing landing: hero, "how it works", feature highlights, showcase teaser.
- **Deliverable:** A real multi-page site; the tool lives at `/analyze`.

## Phase 2 — Code-Intelligence Analytics Dashboard
- GitHub-API-driven metrics (no LLM needed, so quota-free):
  language breakdown, LOC/file counts, dependency freshness, contributor concentration
  (bus factor), commit recency, test/docs presence, security signals, license.
- Composite **Repo Health Score** and derived **Onboarding Difficulty Score**.
- Recharts dashboard with animated count-ups.
- **Deliverable:** A metrics dashboard alongside every brief.

## Phase 3 — Cinematic Agent Visualization v2
- Mission-control canvas: pulsing orchestrator core, radial/orbital option.
- Glowing data packets travelling along cables with directional arrows.
- Live token streaming inside each agent window (see what it's writing).
- Particle bursts on completion, elapsed timer, live token meter, spotlight focus.
- **Deliverable:** A jaw-dropping "something powerful is happening" experience.

## Phase 4 — Persistence & Shareable Briefs
- Neon Postgres + Drizzle: store runs and results.
- `/brief/[id]` permalink pages (shareable with recruiters).
- Personal history of analyzed repos.
- **Deliverable:** Every brief has a shareable link.

## Phase 5 — Reliability Layer
- Real Gemini key (AIza) as primary; richer context for higher accuracy.
- Pre-computed **Showcase** gallery (famous repos) — always works, zero quota.
- **BYOK**: optional visitor-supplied key.
- Result caching + Groq/Gemini provider fallback.
- **Deliverable:** The demo never fails, even at zero quota.

## Phase 6 — Product Features
- Chat with the brief (Q&A over fetched context).
- Auto-generated Day-1 onboarding checklist.
- Compare two repos side by side.
- Export to PDF / Notion; embeddable score badge.
- **Deliverable:** Depth that reads as a real product.

## Phase 7 — Polish & Launch
- SEO/OG images, accessibility, performance, empty/error states.
- `/how-it-works` engineering explainer for recruiters.
- Final QA pass and case-study README.
- **Deliverable:** Launch-ready.

---

### Sequencing note
Phases 1–3 are largely LLM-key-independent (routing, GitHub analytics, visualization), so
they proceed while the real Gemini key is being set up. Phase 5 folds the key in and makes
reliability bulletproof.
