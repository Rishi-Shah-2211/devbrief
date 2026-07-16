"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGenerate } from "@/lib/use-generate";
import { AgentCanvas } from "./AgentCanvas";
import { BriefView } from "./BriefView";

const EXAMPLES = [
  "https://github.com/sindresorhus/slugify",
  "https://github.com/colinhacks/zod",
];

export function DevBriefApp() {
  const { phase, agents, result, error, start, reset } = useGenerate();
  const [url, setUrl] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) start(url.trim());
  };

  return (
    <main
      className={`mx-auto flex w-full flex-col px-6 py-16 transition-[max-width] duration-700 sm:py-20 ${
        phase === "running" ? "max-w-6xl" : "max-w-3xl"
      }`}
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-wine)]">
          AI AGENT ORCHESTRATION
        </span>
        <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
          Understand any codebase
          <br />
          in under a minute.
        </h1>
        <p className="max-w-xl text-balance text-[var(--color-muted)]">
          Paste a public GitHub repository. Watch a team of specialized agents map its
          structure, dependencies, and entry points — then hand you one onboarding brief.
        </p>
      </header>

      <form onSubmit={submit} className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            disabled={phase === "running"}
            className="glass flex-1 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-wine)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={phase === "running"}
            className="rounded-lg bg-[var(--color-wine)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {phase === "running" ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        {phase === "idle" ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-faint)]">
            <span>Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setUrl(ex)}
                className="font-mono text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-wine-bright)] hover:underline"
              >
                {ex.replace("https://github.com/", "")}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <div className="mt-12">
        <AnimatePresence mode="wait">
          {(phase === "running" || phase === "done") && !result ? (
            <motion.div key="graph" exit={{ opacity: 0 }}>
              <AgentCanvas agents={agents} />
            </motion.div>
          ) : null}

          {result ? (
            <motion.div key="brief">
              <BriefView result={result} onReset={reset} />
            </motion.div>
          ) : null}

          {phase === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass mx-auto max-w-md rounded-xl border-[var(--color-error)] px-5 py-4 text-center"
            >
              <div className="text-sm font-medium text-[var(--color-error)]">Generation failed</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{error}</div>
              <button
                onClick={reset}
                className="mt-3 rounded-lg border border-[var(--color-hairline-strong)] px-4 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Try again
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
