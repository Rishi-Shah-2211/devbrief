import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

/** Disconnects GitHub by clearing the token cookie — nothing else to revoke server-side. */
export function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/analyze", new URL(request.url).origin), 303);
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}
