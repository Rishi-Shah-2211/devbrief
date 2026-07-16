import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { STATE_COOKIE, TOKEN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Completes the OAuth dance: verifies the CSRF state, exchanges the code for an
 * access token, and parks the token in an httpOnly cookie. Nothing is persisted
 * server-side.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/analyze?auth_error=${encodeURIComponent(reason)}`, url.origin));

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("The sign-in attempt could not be verified. Try connecting again.");
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return fail("GitHub OAuth is not configured.");
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/auth/github/callback`,
    }),
  });

  const data = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    return fail(data.error_description ?? "GitHub did not return a token.");
  }

  const res = NextResponse.redirect(new URL("/analyze?connected=1", url.origin));
  res.cookies.set(TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours; reconnecting is one click
    path: "/",
  });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
