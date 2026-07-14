# Product Requirements Document — DevBrief

**Version:** 1.0
**Author:** Rishi Shah
**Status:** Draft

---

## 1. Overview

DevBrief is a web application that generates a structured onboarding brief for any public
GitHub repository using a coordinated team of specialized AI agents. It converts the slow,
manual process of understanding a new codebase into a single-click, sub-minute experience,
while visualizing the agent pipeline in real time.

## 2. Problem Statement

Developers joining a new project — new hires, open-source contributors, consultants — spend
significant time building a mental model of an unfamiliar codebase: its structure, its
dependencies, its entry points, and its conventions. This effort is repetitive, poorly
documented, and rarely reusable.

## 3. Goals & Non-Goals

### Goals
- Produce an accurate, readable onboarding brief from a public repo URL in under 60 seconds.
- Demonstrate a robust, observable multi-agent orchestration pattern.
- Make the agent pipeline visible and understandable to a non-technical viewer.
- Run entirely on free-tier infrastructure and APIs.

### Non-Goals (v1)
- Private repository support (requires OAuth; deferred to v2).
- Full semantic code execution or test running.
- Multi-language deep static analysis beyond file/structure heuristics.
- Persisting user accounts and history (optional stretch goal).

## 4. Target Users

| Persona | Need |
|---------|------|
| **New hire / intern** | Understand the assigned codebase quickly on day one |
| **Open-source contributor** | Evaluate an unfamiliar project before contributing |
| **Hiring manager / reviewer** | Skim an applicant's or vendor's repository efficiently |
| **The author (portfolio)** | Demonstrate AI-engineering competence to recruiters |

## 5. User Stories

- *As a new developer,* I paste a repo URL and receive a clear map of the project structure.
- *As a user,* I can watch each agent's status update live so the process feels transparent.
- *As a user,* I can download the final brief as Markdown to share with my team.
- *As a user,* I am told clearly when a repo is too large or invalid, with a helpful message.

## 6. Functional Requirements

1. Accept and validate a public GitHub repository URL.
2. Fetch repository metadata, file tree, and key files via the GitHub REST API.
3. Orchestrate five agents (see [AGENTS.md](AGENTS.md)) with parallel worker execution.
4. Stream each agent's state transitions to the client in real time.
5. Run a critic pass that can re-trigger workers when output is incomplete.
6. Synthesize a single Markdown onboarding brief.
7. Allow the user to download the brief as `DevBrief.md`.

## 7. Non-Functional Requirements

- **Performance:** End-to-end generation < 60s for a typical mid-size repo.
- **Cost:** $0 — free-tier APIs and hosting only.
- **Resilience:** A single agent failure degrades gracefully; the brief still generates.
- **Observability:** Every agent run logs its inputs, latency, and token usage.
- **Accessibility:** UI meets WCAG AA color-contrast and keyboard-navigation basics.

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Generation success rate | > 95% for valid public repos |
| Median end-to-end latency | < 45s |
| Brief usefulness (self-rated on 10 test repos) | ≥ 8/10 |
| Cost per generation | $0 |

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large repos exceed context limits | Heuristic file sampling; cap files read per agent |
| Free-tier rate limits | Cache repo fetches; exponential backoff; graceful queue |
| LLM hallucination about code | Critic pass + cite file paths in every claim |
| Latency from sequential calls | Run independent workers with `Promise.all` |

## 10. Future Scope (v2+)

- Private repo support via GitHub OAuth.
- Persisted history and shareable brief links.
- Language-aware deep analysis (AST-level).
- "Ask a follow-up question" chat over the generated brief.
