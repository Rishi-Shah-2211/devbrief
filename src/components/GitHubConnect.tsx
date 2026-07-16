"use client";

import { useQuery } from "@tanstack/react-query";

interface Me {
  configured: boolean;
  connected: boolean;
  login?: string;
}

/**
 * Connection state for private-repo access. The token lives in an httpOnly
 * cookie; this component only ever sees "connected as X" — never the token.
 */
export function GitHubConnect() {
  const { data } = useQuery<Me>({
    queryKey: ["auth-me"],
    queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
    staleTime: 60_000,
  });

  if (!data?.configured) return null;

  if (data.connected) {
    return (
      <div className="flex items-center justify-center gap-3 text-xs text-[var(--color-faint)]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-done)]" />
          GitHub connected as <span className="font-mono text-[var(--color-muted)]">{data.login}</span>
          — private repos unlocked
        </span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="underline underline-offset-2 hover:text-[var(--color-text)]">
            disconnect
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-faint)]">
      <span>Private repository?</span>
      <a href="/api/auth/github" className="font-medium text-[var(--color-wine)] underline underline-offset-2 hover:text-[var(--color-wine-bright)]">
        Connect GitHub
      </a>
      <span>— read-only, token never stored.</span>
    </div>
  );
}
