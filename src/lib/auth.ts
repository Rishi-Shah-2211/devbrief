import { cookies } from "next/headers";

/**
 * GitHub OAuth session, kept deliberately minimal: the access token lives in an
 * httpOnly, secure cookie on the user's browser — it is never written to the
 * database or any server-side store. Clearing the cookie ends the session.
 */
export const TOKEN_COOKIE = "gh_token";
export const STATE_COOKIE = "gh_oauth_state";

export async function getGitHubToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value || undefined;
}
