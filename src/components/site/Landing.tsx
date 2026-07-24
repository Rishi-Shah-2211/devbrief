"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

/** Types the hero out character by character behind a blinking gold caret. */
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 1), 38);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <>
      {text.slice(0, n)}
      <motion.span
        className="ml-2 inline-block h-[0.75em] w-[4px] translate-y-[0.06em] bg-[var(--color-wine)]"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.85, repeat: Infinity }}
      />
    </>
  );
}

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</section>;
}

const STEPS = [
  { n: "01", c: "#c8a96a", title: "Paste a repo", body: "Drop any public GitHub URL. DevBrief fetches the tree and the highest-value files." },
  { n: "02", c: "#c8a96a", title: "Agents fan out", body: "Specialized agents map structure, dependencies, docs, and a reading path — in parallel." },
  { n: "03", c: "#c8a96a", title: "A critic reviews", body: "A reviewer agent checks for gaps and self-corrects before anything ships." },
  { n: "04", c: "#c8a96a", title: "Get your brief", body: "One cohesive onboarding document, with analytics, ready to read or share." },
];

const FEATURES = [
  { icon: "◉", title: "Multi-agent orchestration", body: "Five role-specialized agents coordinated by a plain-TypeScript orchestrator — no black-box framework." },
  { icon: "▤", title: "Code-intelligence analytics", body: "Health score, dependency freshness, contributor concentration, and an onboarding-difficulty score." },
  { icon: "▶", title: "Live, cinematic pipeline", body: "Watch every agent work in real time — streamed states, flowing data, and a mission-control feel." },
  { icon: "✛", title: "Grounded, not hallucinated", body: "Every claim cites a real file path; a critic pass verifies completeness." },
  { icon: "↯", title: "Provider-resilient by design", body: "Every call walks a fallback chain across three providers — a rate-limited model never kills a run." },
  { icon: "∞", title: "Shareable briefs", body: "Every result gets a permalink you can hand to a teammate or a hiring manager." },
];

export function Landing() {
  return (
    <div className="flex flex-col gap-28 pb-28">
      {/* Hero */}
      <Section className="pt-20 sm:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-6 text-left">
          <motion.span
            {...fadeUp}
            className="rounded-full border border-[rgba(239,234,221,0.12)] bg-[rgba(255,255,255,0.05)] px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl font-mono text-xs tracking-wide text-[var(--color-wine)]"
          >
            OPERATIONS MANUAL · SEC 00 — OVERVIEW
          </motion.span>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="max-w-3xl font-serif text-6xl font-normal leading-[0.95] tracking-tight sm:text-8xl"
          >
            <Typewriter text="Understand any codebase in under a minute." />
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
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Link
              href="/analyze"
              className="btn-primary px-6 py-3 text-sm"
            >
              Analyze a repository
            </Link>
            <Link
              href="/showcase"
              className="btn-secondary px-6 py-3 text-sm"
            >
              See the showcase
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="card p-6"
        >
          <HeroPipeline />
          <div className="mt-3 border-t border-[var(--color-hairline)] pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-faint)]">fig. 01 — orchestration schematic · rev C</div>
        </motion.div>
        </div>
      </Section>

      {/* Stats */}
      <Section>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["5", "specialized agents", "#c8a96a"],
            ["3", "LLM providers", "#c8a96a"],
            ["<60s", "to a full brief", "#c8a96a"],
            ["$0", "on the free tier", "#c8a96a"],
          ].map(([n, l, c]) => (
            <div key={l} className="text-center">
              <div className="font-serif text-4xl" style={{ color: c }}>{n}</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <motion.div {...fadeUp} className="glass px-5 py-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-wine)]">Section 01 — Normal procedures</div>
          <h2 className="mt-1 font-serif text-3xl sm:text-5xl">How it works</h2>
        </motion.div>
        <div className="mt-8 flex flex-col">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="flex items-baseline gap-4 border-b border-[var(--color-hairline)] px-2 py-5 first:border-t"
            >
              <span className="font-mono text-sm text-[var(--color-wine)]">■ 1.{s.n.slice(1)}</span>
              <div className="min-w-0">
                <span className="font-serif text-xl">{s.title}</span>
                <span className="ml-3 hidden font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)] sm:inline">checked</span>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section>
        <motion.div {...fadeUp} className="glass px-5 py-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-wine)]">Section 02 — Exhibit hall</div>
          <h2 className="mt-1 font-serif text-3xl sm:text-5xl">Built like a product, not a demo</h2>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
              className="group overflow-hidden rounded-2xl border border-[rgba(239,234,221,0.1)] bg-[color-mix(in_srgb,var(--color-surface)_48%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl backdrop-saturate-150 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)]"
            >
              <div className="grid h-36 place-items-center" style={{ background: "radial-gradient(60% 70% at 50% 35%, rgba(200,169,106,0.16), transparent 70%)" }}>
                <span className="font-serif text-4xl text-[var(--color-wine)] transition-transform duration-300 group-hover:scale-110">{f.icon}</span>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.35)] bg-[rgba(233,228,214,0.9)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md">
                <div className="font-serif text-lg text-[#1c1a14]">{f.title}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-[#57503e]">{f.body}</div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8a8371]">Exhibit 2.{i + 1} · DevBrief collection</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl border border-[rgba(239,234,221,0.12)] bg-[color-mix(in_srgb,var(--color-ink)_55%,transparent)] px-8 py-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(80% 120% at 50% 0%, rgba(200,169,106,0.22), transparent 60%)" }}
          />
          <h2 className="relative font-serif text-3xl text-[#efeadd] sm:text-4xl">
            Point it at a repository.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[var(--color-muted)]">
            See the agents work, read the brief, and never lose a day to onboarding again.
          </p>
          <Link
            href="/analyze"
            className="relative mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-[var(--color-ink)] shadow-[var(--shadow-2)] transition-opacity hover:opacity-90"
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
        <text x="320" y="45" textAnchor="middle" fontSize="13" fill="var(--color-text)" fontWeight="600">Orchestrator</text>
      </g>
      {/* workers */}
      {[["Architect", 140], ["Dependency", 260], ["Docs", 380], ["Start Here", 500]].map(([label, x]) => (
        <g key={label as string}>
          <rect x={(x as number) - 56} y="116" width="112" height="52" rx="8" fill="var(--color-surface-2)" stroke="var(--color-hairline-strong)" />
          <circle cx={(x as number) - 40} cy="132" r="3" fill="var(--color-gold)" />
          <text x={x as number} y="150" textAnchor="middle" fontSize="12" fill="var(--color-text)" fontWeight="600">{label}</text>
        </g>
      ))}
      {/* synthesizer */}
      <g>
        <rect x="248" y="214" width="144" height="34" rx="8" fill="var(--color-wine)" />
        <text x="320" y="235" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="600">Synthesizer → Brief</text>
      </g>
    </svg>
  );
}
