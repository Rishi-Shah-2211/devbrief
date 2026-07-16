import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { STATE_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

/** Kicks off the GitHub OAuth dance with a CSRF state nonce. */
export function GET(request: Request) {
  if (!env.GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: "GitHub OAuth is not configured." }, { status: 501 });
  }

  const state = randomBytes(16).toString("hex");
  const origin = new URL(request.url).origin;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/github/callback`);
  // "repo" grants read access to private repositories (GitHub's finest OAuth granularity).
  authorize.searchParams.set("scope", "repo");
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
