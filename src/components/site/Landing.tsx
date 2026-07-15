"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</section>;
}

const STEPS = [
  { n: "01", title: "Paste a repo", body: "Drop any public GitHub URL. DevBrief fetches the tree and the highest-value files." },
  { n: "02", title: "Agents fan out", body: "Specialized agents map structure, dependencies, docs, and a reading path — in parallel." },
  { n: "03", title: "A critic reviews", body: "A reviewer agent checks for gaps and self-corrects before anything ships." },
  { n: "04", title: "Get your brief", body: "One cohesive onboarding document, with analytics, ready to read or share." },
];

const FEATURES = [
  { icon: "🧠", title: "Multi-agent orchestration", body: "Five role-specialized agents coordinated by a plain-TypeScript orchestrator — no black-box framework." },
  { icon: "📊", title: "Code-intelligence analytics", body: "Health score, dependency freshness, contributor concentration, and an onboarding-difficulty score." },
  { icon: "🎬", title: "Live, cinematic pipeline", body: "Watch every agent work in real time — streamed states, flowing data, and a mission-control feel." },
  { icon: "🎯", title: "Grounded, not hallucinated", body: "Every claim cites a real file path; a critic pass verifies completeness." },
  { icon: "⚡", title: "Cost-aware by design", body: "Fast workers on Groq, large-context reasoning on Gemini — routed to balance speed and cost." },
  { icon: "🔗", title: "Shareable briefs", body: "Every result gets a permalink you can hand to a teammate or a hiring manager." },
];

export function Landing() {
  return (
    <div className="flex flex-col gap-28 pb-28">
      {/* Hero */}
      <Section className="pt-20 sm:pt-28">
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.span
            {...fadeUp}
            className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-1 font-mono text-xs tracking-wide text-[var(--color-wine)]"
          >
            AI AGENT ORCHESTRATION
          </motion.span>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="max-w-3xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-7xl"
          >
            Understand any codebase in under a minute.
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="max-w-xl text-lg text-[var(--color-muted)]"
          >
            DevBrief sends a team of specialized AI agents into any GitHub repository and hands
            you a single, accurate onboarding brief — with the analysis happening live.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link
              href="/analyze"
              className="rounded-lg bg-[var(--color-wine)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Analyze a repository
            </Link>
            <Link
              href="/showcase"
              className="rounded-lg border border-[var(--color-hairline-strong)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
            >
              See the showcase
            </Link>
          </motion.div>
        </div>

        {/* Pipeline hero graphic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <HeroPipeline />
        </motion.div>
      </Section>

      {/* Stats */}
      <Section>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["5", "specialized agents"],
            ["2", "LLM providers"],
            ["<60s", "to a full brief"],
            ["$0", "on the free tier"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-serif text-4xl text-[var(--color-wine)]">{n}</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <motion.h2 {...fadeUp} className="text-center font-serif text-3xl sm:text-4xl">
          How it works
        </motion.h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="glass rounded-xl p-5"
            >
              <div className="font-mono text-sm text-[var(--color-gold)]">{s.n}</div>
              <div className="mt-2 font-serif text-xl">{s.title}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{s.body}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section>
        <motion.h2 {...fadeUp} className="text-center font-serif text-3xl sm:text-4xl">
          Built like a product, not a demo
        </motion.h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
              className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-6 transition-shadow hover:shadow-[0_12px_40px_-16px_var(--color-wine-glow)]"
            >
              <div className="text-2xl">{f.icon}</div>
              <div className="mt-3 font-serif text-xl">{f.title}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{f.body}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-ink)] px-8 py-14 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(80% 120% at 50% 0%, rgba(173,135,84,0.18), transparent 60%)" }}
          />
          <h2 className="relative font-serif text-3xl text-[#faf8f6] sm:text-4xl">
            Point it at a repository.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[#c9c2c6]">
            See the agents work, read the brief, and never lose a day to onboarding again.
          </p>
          <Link
            href="/analyze"
            className="relative mt-6 inline-block rounded-lg bg-[var(--color-gold)] px-6 py-3 text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90"
          >
            Start analyzing →
          </Link>
        </motion.div>
      </Section>
    </div>
  );
}

/** A calm, static diagram of the agent pipeline for the hero. */
export function HeroPipeline() {
  return (
    <svg viewBox="0 0 640 260" className="w-full" role="img" aria-label="DevBrief agent pipeline">
      <defs>
        <marker id="hp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-wine)" />
        </marker>
      </defs>
      {/* cables */}
      {[140, 260, 380, 500].map((x) => (
        <path
          key={x}
          d={`M320 56 C320 90, ${x} 90, ${x} 116`}
          fill="none"
          stroke="var(--color-wine)"
          strokeWidth="1.4"
          opacity="0.5"
          markerEnd="url(#hp-arrow)"
        />
      ))}
      {[140, 260, 380, 500].map((x) => (
        <path
          key={`b${x}`}
          d={`M${x} 168 C${x} 196, 320 196, 320 214`}
          fill="none"
          stroke="var(--color-wine)"
          strokeWidth="1.4"
          opacity="0.5"
          markerEnd="url(#hp-arrow)"
        />
      ))}
      {/* orchestrator */}
      <g>
        <rect x="256" y="24" width="128" height="34" rx="8" fill="var(--color-surface-2)" stroke="var(--color-hairline-strong)" />
        <text x="320" y="45" textAnchor="middle" fontSize="13" fill="var(--color-text)" fontFamily="serif">Orchestrator</text>
      </g>
      {/* workers */}
      {[["Architect", 140], ["Dependency", 260], ["Docs", 380], ["Start Here", 500]].map(([label, x]) => (
        <g key={label as string}>
          <rect x={(x as number) - 56} y="116" width="112" height="52" rx="8" fill="var(--color-surface-2)" stroke="var(--color-hairline-strong)" />
          <circle cx={(x as number) - 40} cy="132" r="3" fill="var(--color-gold)" />
          <text x={x as number} y="150" textAnchor="middle" fontSize="12" fill="var(--color-text)" fontFamily="serif">{label}</text>
        </g>
      ))}
      {/* synthesizer */}
      <g>
        <rect x="248" y="214" width="144" height="34" rx="8" fill="var(--color-wine)" />
        <text x="320" y="235" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="serif">Synthesizer → Brief</text>
      </g>
    </svg>
  );
}
