import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getGitHubToken } from "@/lib/auth";

export const runtime = "nodejs";

/** Reports the connection state so the UI can show who's signed in. */
export async function GET() {
  const configured = Boolean(env.GITHUB_CLIENT_ID);
  const token = await getGitHubToken();
  if (!token) return NextResponse.json({ configured, connected: false });

  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return NextResponse.json({ configured, connected: false });

  const user = (await res.json()) as { login: string };
  return NextResponse.json({ configured, connected: true, login: user.login });
}
