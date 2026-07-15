import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--color-muted)] sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-[var(--color-wine)] font-serif text-xs text-white">
            D
          </span>
          <span>DevBrief — AI codebase onboarding</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/how-it-works" className="hover:text-[var(--color-text)]">How it works</Link>
          <a
            href="https://github.com/Rishi-Shah-2211/devbrief"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-text)]"
          >
            GitHub
          </a>
          <a href="https://portfolio-rhs.vercel.app" target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)]">
            Built by Rishi Shah
          </a>
        </div>
      </div>
    </footer>
  );
}
