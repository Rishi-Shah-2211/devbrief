export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium tracking-wide text-[var(--color-accent)]">
          AI AGENT ORCHESTRATION
        </span>
        <h1 className="text-balance text-5xl font-semibold leading-tight">
          Understand any codebase in under a minute.
        </h1>
        <p className="text-balance text-lg text-[var(--color-muted)]">
          Paste a public GitHub repository and watch a team of specialized AI agents map its
          structure, dependencies, and entry points — then hand you a single onboarding brief.
        </p>
      </div>

      {/* Repo input lands here in Phase 1. */}
      <form className="flex w-full max-w-lg gap-2" aria-label="Analyze a repository">
        <input
          type="url"
          name="repoUrl"
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          disabled
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          disabled
        >
          Analyze
        </button>
      </form>

      <p className="text-xs text-[var(--color-muted)]">
        Phase 0 scaffold — pipeline wiring comes next.
      </p>
    </main>
  );
}
