"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ChatPanel } from "./ChatPanel";
import type { GenerateResult } from "@/lib/use-generate";

interface Props {
  result: GenerateResult;
  /** Omitted on showcase pages, where there is no run to reset. */
  onReset?: () => void;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BriefView({ result, onReset }: Props) {
  const [building, setBuilding] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = result.repo.replace("/", "-");

  const copyLink = async () => {
    if (!result.briefId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/brief/${result.briefId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    saveBlob(new Blob([result.brief], { type: "text/markdown" }), `DevBrief-${slug}.md`);
  };

  /** The PDF renderer is heavy, so it loads only when someone actually asks for it. */
  const downloadPdf = async () => {
    setBuilding(true);
    try {
      const [{ pdf }, { BriefDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf/BriefDocument"),
      ]);
      const blob = await pdf(
        <BriefDocument
          repo={result.repo}
          description={result.description}
          brief={result.brief}
          analytics={result.analytics}
          generatedAt={new Date().toLocaleDateString("en-CA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />,
      ).toBlob();
      saveBlob(blob, `DevBrief-${slug}.pdf`);
    } finally {
      setBuilding(false);
    }
  };

  const a = result.analytics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-[var(--color-wine)]">{result.repo}</div>
          <div className="text-xs text-[var(--color-faint)]">
            {result.tokensUsed.toLocaleString()} tokens · generated on the free tier
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadPdf}
            disabled={building}
            className="rounded-lg bg-[var(--color-wine)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {building ? "Preparing PDF…" : "Download PDF report"}
          </button>
          {result.briefId ? (
            <button
              onClick={copyLink}
              className="rounded-lg border border-[var(--color-hairline-strong)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          ) : null}
          <button
            onClick={downloadMarkdown}
            className="rounded-lg border border-[var(--color-hairline-strong)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            .md
          </button>
          {onReset ? (
            <button
              onClick={onReset}
              className="rounded-lg border border-[var(--color-hairline-strong)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              New brief
            </button>
          ) : null}
        </div>
      </div>

      {/* Compact analytics strip — the full dashboard lands with the UI overhaul. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Health", `${a.healthScore}/100`],
          ["Files", a.totalFiles.toLocaleString()],
          ["Dependencies", a.dependencyCount?.toString() ?? "—"],
          ["Onboarding", a.onboardingDifficulty],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-faint)]">{label}</div>
            <div className="font-serif text-xl text-[var(--color-wine)]">{value}</div>
          </div>
        ))}
      </div>

      <article className="brief glass rounded-2xl px-6 py-6 sm:px-8">
        <ReactMarkdown>{result.brief}</ReactMarkdown>
      </article>

      <ChatPanel repo={result.repo} brief={result.brief} />
    </motion.div>
  );
}
