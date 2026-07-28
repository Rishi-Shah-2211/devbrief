"use client";

import { isValidElement, useMemo, useState } from "react";
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

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Flattens rendered children back to plain text so headings can be anchored. */
function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) return nodeText((node.props as { children?: React.ReactNode }).children);
  return "";
}

export function BriefView({ result, onReset }: Props) {
  const [building, setBuilding] = useState(false);
  const [copied, setCopied] = useState(false);
  const repoSlug = result.repo.replace("/", "-");

  /** Section register for the left rail, read straight off the document. */
  const sections = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    for (const line of result.brief.split("\n")) {
      const m = /^##\s+(.+?)\s*$/.exec(line);
      if (!m) continue;
      const text = m[1].replace(/[*_`#]/g, "").trim();
      if (text) out.push({ id: slug(text), text });
    }
    return out;
  }, [result.brief]);

  /** Every file path the agents cited — the dossier's margin evidence. */
  const cited = useMemo(() => {
    const set = new Set<string>();
    const re = /`([^`\n]{2,64})`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(result.brief))) {
      const v = m[1].trim();
      if (/\.[a-z0-9]{1,6}$/i.test(v) || v.includes("/")) set.add(v);
    }
    return [...set].slice(0, 12);
  }, [result.brief]);

  const copyLink = async () => {
    if (!result.briefId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/brief/${result.briefId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    saveBlob(new Blob([result.brief], { type: "text/markdown" }), `DevBrief-${repoSlug}.md`);
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
      saveBlob(blob, `DevBrief-${repoSlug}.pdf`);
    } catch (err) {
      // Surface the real failure instead of a silently dead button.
      alert(`PDF generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Dossier head */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-hairline)] pb-5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-faint)]">
            Onboarding dossier · file {repoSlug}
          </div>
          <h1 className="mt-1 break-words font-serif text-3xl tracking-tight sm:text-4xl">{result.repo}</h1>
          <div className="mt-1 font-mono text-[11px] text-[var(--color-faint)]">
            {result.tokensUsed.toLocaleString()} tokens · generated on the free tier
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Index · document · margin */}
      <div className="grid items-start gap-6 lg:grid-cols-[168px_minmax(0,1fr)_336px] xl:grid-cols-[196px_minmax(0,1fr)_396px]">
        <aside className="hidden min-w-0 lg:sticky lg:top-20 lg:block">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Contents
          </div>
          <nav className="mt-3 flex flex-col">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex gap-2.5 border-b border-[var(--color-hairline)] py-2 text-[13px] leading-snug text-[var(--color-muted)] transition-colors first:border-t hover:text-[var(--color-wine)]"
              >
                <span className="font-mono text-[10px] text-[var(--color-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-words">{s.text}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <AnalyticsDashboard analytics={result.analytics} />
          <article className="brief glass min-w-0 overflow-hidden px-6 py-6 sm:px-9 sm:py-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 id={slug(nodeText(children))}>{children}</h2>,
              }}
            >
              {result.brief}
            </ReactMarkdown>
          </article>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20">
          {cited.length > 0 ? (
            <div className="card p-5">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-faint)]">
                Cited in this dossier
              </div>
              <ul className="flex flex-col gap-1.5">
                {cited.map((f) => (
                  <li key={f} className="truncate font-mono text-[11px] text-[var(--color-gold)]">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ChatPanel repo={result.repo} brief={result.brief} />
        </div>
      </div>
    </motion.div>
  );
}
