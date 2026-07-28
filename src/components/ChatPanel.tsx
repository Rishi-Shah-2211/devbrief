"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  repo: string;
  brief: string;
}

/** Canned prompts that showcase what the guide can do — including the Day-1 checklist. */
const QUICK_ACTIONS: { label: string; color: string; question: string }[] = [
  {
    label: "Day-1 checklist",
    color: "#4e7b4a",
    question:
      "Generate a practical day-1 onboarding checklist for a developer joining this project: environment setup, the files to read in order, and a small first task to attempt. Use checkboxes.",
  },
  { label: "Where do I start?", color: "#2f5468", question: "Which single file should I open first, and why?" },
  { label: "Explain the architecture", color: "#7a4a86", question: "Explain the architecture in three short paragraphs." },
  { label: "What should I watch out for?", color: "#a5722a", question: "What are the sharp edges or gotchas a newcomer should watch out for in this codebase?" },
];

export function ChatPanel({ repo, brief }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    if (busy || !question.trim()) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: question }, { role: "assistant", text: "" }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, question, brief }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Request failed." }));
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", text: `_${data.error ?? "Request failed."}_` };
          return next;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          next[next.length - 1] = { role: "assistant", text: last.text + chunk };
          return next;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="mb-1 font-serif text-xl">Ask about this repository</div>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Answers are grounded in the brief and the repository's actual files.
      </p>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => ask(qa.question)}
            disabled={busy}
            className="rounded-full border border-[var(--color-hairline-strong)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-wine)] hover:text-[var(--color-wine)] disabled:opacity-40"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <AnimatePresence>
        {messages.length > 0 ? (
          <motion.div
            ref={scrollRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex max-h-[28rem] min-w-0 flex-col gap-3 overflow-y-auto pr-1"
          >
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="max-w-[92%] self-end break-words rounded-xl bg-[var(--color-wine)] px-4 py-2 text-sm text-[#fbf8f1]">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="brief max-w-[96%] min-w-0 self-start overflow-hidden rounded-xl border border-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_0_0_1px_rgba(22,20,15,0.05)] backdrop-blur-xl">
                  {m.text ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  ) : (
                    <motion.span
                      className="inline-block text-[var(--color-faint)]"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      thinking…
                    </motion.span>
                  )}
                </div>
              ),
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How does routing work here?"
          disabled={busy}
          className="glass flex-1 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-wine)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-[var(--color-wine)] px-4 py-2.5 text-sm font-medium text-[#fbf8f1] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
