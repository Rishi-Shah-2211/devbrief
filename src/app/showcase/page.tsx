import type { Metadata } from "next";
import Link from "next/link";
import { SHOWCASE } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "Showcase — DevBrief",
  description: "Pre-analyzed onboarding briefs for well-known open-source repositories.",
};

export default function ShowcasePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <header className="mb-12 text-center">
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-wine)]">SHOWCASE</span>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Briefs you can read right now</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted)]">
          Real output from the full agent pipeline, pre-computed for well-known repositories —
          open any of them and see exactly what DevBrief produces.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE.map((e) => (
          <Link
            key={e.slug}
            href={`/showcase/${e.slug}`}
            className="group rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-16px_var(--color-wine-glow)]"
          >
            <div className="font-mono text-xs text-[var(--color-wine)]">{e.repo}</div>
            <p className="mt-2 line-clamp-2 min-h-[2.6em] text-sm text-[var(--color-muted)]">
              {e.description}
            </p>

            <div className="mt-4 flex items-center gap-4 border-t border-[var(--color-hairline)] pt-4 text-xs text-[var(--color-faint)]">
              <span>
                Health <span className="font-serif text-base text-[var(--color-wine)]">{e.analytics.healthScore}</span>
              </span>
              <span>{e.analytics.totalFiles.toLocaleString()} files</span>
              <span className="capitalize">{e.analytics.onboardingDifficulty}</span>
            </div>

            <div className="mt-4 text-sm font-medium text-[var(--color-wine)] opacity-0 transition-opacity group-hover:opacity-100">
              Read the brief →
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-[var(--color-faint)]">
        Want one for your own repository?{" "}
        <Link href="/analyze" className="text-[var(--color-wine)] underline underline-offset-2">
          Analyze it live
        </Link>
        .
      </p>
    </main>
  );
}
