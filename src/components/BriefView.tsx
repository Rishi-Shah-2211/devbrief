"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
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
          <button onClick={downloadPdf} disabled={building} className="btn-primary px-4 py-2 text-sm">
            {building ? "Preparing PDF…" : "Download PDF report"}
          </button>
          {result.briefId ? (
            <button onClick={copyLink} className="btn-secondary px-4 py-2 text-sm">
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          ) : null}
          <button onClick={downloadMarkdown} className="btn-secondary px-4 py-2 text-sm">
            .md
          </button>
          {onReset ? (
            <button onClick={onReset} className="btn-secondary px-4 py-2 text-sm">
              New brief
            </button>
          ) : null}
        </div>
      </div>

      {/* Report left, chat docked beside it — visible without scrolling. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-last flex min-w-0 flex-col gap-4 lg:order-none">
          <AnalyticsDashboard analytics={a} />
          <article className="brief glass rounded-2xl px-6 py-6 sm:px-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.brief}</ReactMarkdown>
          </article>
        </div>
        <div className="lg:sticky lg:top-20">
          <ChatPanel repo={result.repo} brief={result.brief} />
        </div>
      </div>
    </motion.div>
  );
}
