"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GitHubConnect } from "@/components/GitHubConnect";

const NAV = [
  { href: "/analyze", label: "Analyze", mark: "01", color: "#c8a96a" },
  { href: "/showcase", label: "Showcase", mark: "02", color: "#c8a96a" },
  { href: "/how-it-works", label: "Docs", mark: "03", color: "#c8a96a" },
];

function crumbsFrom(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return ["Workspace"];
  const [head, ...rest] = parts;
  const name = head === "brief" ? "Briefs" : head.charAt(0).toUpperCase() + head.slice(1);
  return [name, ...rest.map((p) => decodeURIComponent(p))];
}

/**
 * Console shell for product pages: a quiet left rail and a breadcrumb topbar,
 * so the tool reads as installed software rather than a website.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = crumbsFrom(pathname);

  return (
    <div className="flex min-h-screen">
      {/* Rail */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-5 md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-wine)] text-[13px] font-semibold text-[#131316]">
            D
          </span>
          <span className="font-serif text-[17px] tracking-tight">DevBrief</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "" : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                }`}
                style={active ? { color: item.color } : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-lg bg-[var(--color-surface)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative font-mono text-[10px] text-[var(--color-faint)]">{item.mark}</span>
                <span className="relative font-mono text-[12px] uppercase tracking-[0.14em]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--color-hairline)] pt-4">
          <div className="px-1 text-[11px] leading-relaxed text-[var(--color-faint)]">
            <GitHubConnect />
          </div>
          <a
            href="https://portfolio-rhs.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="mt-3 block px-2 text-[11px] text-[var(--color-faint)] hover:text-[var(--color-text)]"
          >
            Built by Rishi Shah
          </a>
        </div>
      </aside>

      {/* Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[var(--color-hairline)] bg-[color-mix(in_srgb,var(--color-canvas)_88%,transparent)] px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-[var(--color-faint)]">
            <Link href="/" className="text-[var(--color-muted)] hover:text-[var(--color-text)] md:hidden">
              DevBrief
            </Link>
            <span className="hidden text-[var(--color-wine)] md:inline">devbrief</span>
            <span className="hidden rounded border border-[var(--color-hairline)] px-1.5 py-0.5 text-[9px] uppercase tracking-widest md:inline">rev C</span>
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-2">
                <span className="text-[var(--color-hairline-strong)]">/</span>
                <span className={`truncate ${i === crumbs.length - 1 ? "text-[var(--color-text)]" : ""}`}>{c}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {n.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
