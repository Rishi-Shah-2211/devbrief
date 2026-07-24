import type { Metadata } from "next";
import Link from "next/link";
import { HeroPipeline } from "@/components/site/Landing";

export const metadata: Metadata = {
  title: "How it works — DevBrief",
  description:
    "The engineering behind DevBrief: parallel agents, a critic feedback loop, multi-provider routing, and grounded citations.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Orchestration without a framework",
    body: [
      "DevBrief's pipeline is plain TypeScript — no LangChain, no CrewAI. The orchestrator fans four specialist workers out concurrently (bounded by a concurrency cap), collects their results, and hands them to a critic. Choosing not to add a framework was deliberate: the control flow fits in one readable file, and every failure mode is explicit.",
    ],
  },
  {
    title: "Role-specialized agents",
    body: [
      "Each worker owns one question. Architect: how is the code organized? Dependency: what does it stand on? Docs: what does it say about itself? Start-Here: what should a newcomer read first, in what order? Narrow prompts produce sharper, cheaper answers than one giant request — and they can run in parallel.",
    ],
  },
  {
    title: "The critic feedback loop",
    body: [
      "Before anything ships, a critic agent reviews all four sections for gaps, missing citations, and contradictions. If it flags problems, only the flagged workers re-run — once. Bounding the retry keeps latency and cost predictable while still letting the pipeline self-correct. You can watch this happen live: the critic regularly sends agents back to work.",
    ],
  },
  {
    title: "Grounded, citation-first output",
    body: [
      "Hallucination control is structural, not hopeful. Every agent must back claims with real file paths; citations are then verified against the actual repository tree rather than trusting the model's self-report. If information is missing, agents are instructed to say so.",
    ],
  },
  {
    title: "Multi-provider resilience",
    body: [
      "Every model call walks a fallback chain across three providers — Cerebras, Groq, and OpenRouter — all speaking the same OpenAI dialect through one small fetch client. A rate-limited or exhausted provider never kills a run; the next one picks up the request mid-pipeline. The live UI shows which provider served each agent.",
      "Chains are role-tuned: workers prioritize fast, high-volume inference; the synthesizer prioritizes large context windows for coherent long-form assembly.",
    ],
  },
  {
    title: "Streaming, end to end",
    body: [
      "Providers stream tokens over SSE; the server rebroadcasts throttled progress events as newline-delimited JSON; the client renders each agent's actual output as it is written. The mission-control view — data packets on cables, live consoles, token meters — is driven entirely by this one event stream.",
    ],
  },
  {
    title: "Analytics without tokens",
    body: [
      "Repository health, language composition, dependency counts, hygiene signals, and the onboarding-difficulty score are computed directly from the repository tree — deterministic, instant, and free. The LLM budget is spent only where language models actually add value.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <header className="text-center">
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-wine)]">ENGINEERING</span>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">How DevBrief works</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted)]">
          A short tour of the decisions behind the pipeline — written for engineers who want
          to know what is actually happening under the animation.
        </p>
      </header>

      <div className="mt-12">
        <HeroPipeline />
      </div>

      <div className="mt-14 flex flex-col gap-10">
        {SECTIONS.map((s, i) => (
          <section key={s.title}>
            <h2 className="font-serif text-2xl">
              <span className="mr-3 font-mono text-sm text-[var(--color-gold)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.title}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-3 leading-relaxed text-[var(--color-muted)]">{p}</p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-16 glass p-6 text-center">
        <p className="text-[var(--color-muted)]">See it for yourself — the whole pipeline runs live.</p>
        <Link
          href="/analyze"
          className="mt-4 inline-block rounded-lg bg-[var(--color-wine)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Analyze a repository →
        </Link>
      </div>
    </main>
  );
}
