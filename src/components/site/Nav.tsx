"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/showcase", label: "Showcase" },
  { href: "/how-it-works", label: "How it works" },
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b transition-shadow duration-300"
      style={{
        borderColor: "var(--color-hairline)",
        background: "color-mix(in srgb, var(--color-canvas) 85%, transparent)",
        backdropFilter: "blur(12px)",
        boxShadow: scrolled ? "var(--shadow-2)" : "none",
      }}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-wine)] text-[13px] font-semibold text-[#131316] shadow-[var(--shadow-1)]">
            D
          </span>
          <span className="font-serif text-[17px] tracking-tight">DevBrief</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-1 shadow-[var(--shadow-1)] sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  active ? "text-white" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-wine)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <Link href="/analyze" className="btn-primary px-4 py-1.5 text-[13px]">
          Analyze a repo
        </Link>
      </nav>
    </header>
  );
}
