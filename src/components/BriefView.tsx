"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { GenerateResult } from "@/lib/use-generate";

interface Props {
  result: GenerateResult;
  onReset: () => void;
}

export function BriefView({ result, onReset }: Props) {
  const download = () => {
    const blob = new Blob([result.brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DevBrief-${result.repo.replace("/", "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            onClick={download}
            className="rounded-lg bg-[var(--color-wine)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Download .md
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-[var(--color-hairline-strong)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            New brief
          </button>
        </div>
      </div>

      <article className="brief glass rounded-2xl px-6 py-6 sm:px-8">
        <ReactMarkdown>{result.brief}</ReactMarkdown>
      </article>
    </motion.div>
  );
}
