import Link from "next/link";

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-32 text-center">
      <span className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-1 font-mono text-xs text-[var(--color-gold)]">
        COMING SOON
      </span>
      <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
      <p className="max-w-md text-[var(--color-muted)]">{blurb}</p>
      <Link
        href="/analyze"
        className="mt-2 rounded-lg bg-[var(--color-wine)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Analyze a repo now →
      </Link>
    </main>
  );
}
