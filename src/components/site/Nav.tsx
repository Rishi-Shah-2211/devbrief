"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/showcase", label: "Showcase" },
  { href: "/how-it-works", label: "How it works" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-hairline)] bg-[color-mix(in_srgb,var(--color-canvas)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-wine)] font-serif text-sm text-white">
            D
          </span>
          <span className="font-serif text-lg tracking-tight">DevBrief</span>
        </Link>

        <div className="hidden items-center gap-7 sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors ${
                  active ? "text-[var(--color-text)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/analyze"
          className="rounded-lg bg-[var(--color-wine)] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Analyze a repo
        </Link>
      </nav>
    </header>
  );
}
