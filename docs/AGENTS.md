# Agent Specifications — DevBrief

DevBrief coordinates six agents: one orchestrator, four parallel workers, one critic, and
one synthesizer. Each is defined by a clear role, input/output contract, and prompt
strategy. Every worker must **cite file paths** for its claims.

---

## Model Routing

| Role | Model | Rationale |
|------|-------|-----------|
| Orchestrator | Google Gemini | Large context window for whole-repo reasoning & planning |
| Workers (×4) | Groq · llama-3.3-70b | Fast, cheap, parallel-friendly for focused subtasks |
| Critic | Groq · llama-3.3-70b | Lightweight verification pass |
| Synthesizer | Google Gemini | Coherent long-form merge of all outputs |

---

## 1. Orchestrator

- **Role:** Decompose the task, decide which workers run, and allocate a relevant slice of
  the repository to each (file sampling to stay within context limits).
- **Input:** Repo metadata (name, description, languages, top-level file tree).
- **Output:** A plan — `{ workers: WorkerName[], fileAssignments: Record<WorkerName, string[]> }`.
- **Prompt strategy:** System role as a "technical lead." Instructed to prioritize entry
  points (`package.json`, `main`, `index`, config, README) and to avoid over-sampling.

## 2. Architect Agent (worker)

- **Role:** Produce a structural map of the project — modules, layers, and their relationships.
- **Input:** File tree + a sample of directory-representative files.
- **Output:** Markdown section: annotated folder map + a short "how the pieces fit" summary.
- **Prompt strategy:** "Explain the structure to a developer joining today." Must reference
  real paths; no invented folders.

## 3. Dependency Agent (worker)

- **Role:** Identify libraries, frameworks, and versions; flag notable or risky ones.
- **Input:** Manifest files (`package.json`, `requirements.txt`, `go.mod`, etc.).
- **Output:** Markdown table of key dependencies with purpose and version.
- **Prompt strategy:** Group by concern (framework, data, testing, build). Note anything
  outdated or security-relevant if evident from versions.

## 4. Docs Agent (worker)

- **Role:** Summarize existing documentation and meaningful inline comments.
- **Input:** README, `/docs`, and comment-dense files.
- **Output:** Concise "what the project says about itself" summary; flags missing docs.
- **Prompt strategy:** Distinguish documented intent from actual code; never fabricate
  features not present in the source.

## 5. Start-Here Agent (worker)

- **Role:** Recommend the exact files a newcomer should read first, in order.
- **Input:** Entry points, routing/config, and the architect's structural cues.
- **Output:** Ordered "read this first" list with a one-line reason per file.
- **Prompt strategy:** Optimize for the fastest path to a working mental model; 5–8 files max.

## 6. Critic Agent

- **Role:** Verify completeness and internal consistency across all worker outputs.
- **Input:** All `AgentResult`s.
- **Output:** `{ verdict: 'APPROVED' | 'REVISE', gaps: { agent, reason }[] }`.
- **Prompt strategy:** Act as a skeptical reviewer. Check that claims cite paths, that no
  major area is missing, and that sections don't contradict each other. Bounded to one
  retry cycle to control latency and cost.

## 7. Synthesizer Agent

- **Role:** Merge validated outputs into one polished onboarding brief.
- **Input:** Approved `AgentResult`s.
- **Output:** Final `DevBrief.md` — title, overview, structure, dependencies, docs summary,
  and a "Start Here" path, in a consistent voice.
- **Prompt strategy:** Prioritize readability and flow; deduplicate overlapping content;
  preserve citations.

---

## Shared Prompt Rules (all agents)

1. **Cite paths.** Every factual claim references a real file path.
2. **No fabrication.** If information is absent, say so explicitly.
3. **Audience.** Write for a competent developer seeing the repo for the first time.
4. **Brevity.** Prefer tight, scannable prose over exhaustive dumps.
5. **Determinism.** Low temperature for workers and critic; slightly higher for the
   synthesizer's prose only.
