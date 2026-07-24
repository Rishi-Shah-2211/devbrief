import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(239,234,221,0.08)] bg-[color-mix(in_srgb,var(--color-surface-2)_40%,transparent)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded bg-[var(--color-wine)] text-[11px] font-semibold text-[#131316]">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight">DevBrief</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-faint)]">
            Multi-agent codebase intelligence — from repository URL to onboarding brief in
            under a minute.
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-faint)]">Product</span>
            <Link href="/analyze" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">Analyze</Link>
            <Link href="/showcase" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">Showcase</Link>
            <Link href="/how-it-works" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">How it works</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-faint)]">Author</span>
            <a href="https://github.com/Rishi-Shah-2211/devbrief" target="_blank" rel="noreferrer" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
              GitHub
            </a>
            <a href="https://portfolio-rhs.vercel.app" target="_blank" rel="noreferrer" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
              Portfolio
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--color-hairline)] py-4 text-center text-xs text-[var(--color-faint)]">
        Built by Rishi Shah · Next.js 16 · Multi-provider AI orchestration
      </div>
    </footer>
  );
}
