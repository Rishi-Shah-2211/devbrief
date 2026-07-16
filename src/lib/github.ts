import { z } from "zod";
import { env } from "@/lib/env";
import type { PipelineContext, RepoFile } from "@/orchestrator/types";

const GITHUB_API = "https://api.github.com";

/** Files worth reading first — entry points, manifests, and docs. */
const PRIORITY_PATTERNS = [
  /^readme(\.md)?$/i,
  /^package\.json$/i,
  /^(requirements\.txt|pyproject\.toml|go\.mod|cargo\.toml|composer\.json)$/i,
  /^(next|vite|tsconfig|nuxt|svelte|astro)\.config\.[jt]s$/i,
  /^(index|main|app)\.[jt]sx?$/i,
  /^src\/(index|main|app)\.[jt]sx?$/i,
];

/** Directories that add noise without helping a human understand the project. */
const IGNORED_DIRS = /(^|\/)(node_modules|dist|build|\.next|out|vendor|\.git|coverage)(\/|$)/;

/** Skip binaries and lockfiles — they cost tokens and teach nothing. */
const IGNORED_FILES = /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|lock|min\.js))$/i;

const MAX_FILES = 12;
const MAX_FILE_BYTES = 32_000;

export class RepoFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RepoFetchError";
  }
}

const repoUrlSchema = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/\.git$/, ""))
  .refine((raw) => /github\.com\/[^/]+\/[^/]+/.test(raw), {
    message: "Enter a valid GitHub repository URL (https://github.com/owner/repo).",
  });

export function parseRepoUrl(input: string): { owner: string; repo: string } {
  const url = repoUrlSchema.parse(input);
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) {
    throw new RepoFetchError("Could not read owner and repository from that URL.");
  }
  return { owner: match[1], repo: match[2] };
}

function headers(userToken?: string): HeadersInit {
  const base: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = userToken ?? env.GITHUB_TOKEN;
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function github<T>(path: string, userToken?: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: headers(userToken) });

  if (res.status === 404) {
    throw new RepoFetchError(
      userToken
        ? "Repository not found — check the URL, or your GitHub account may lack access to it."
        : "Repository not found. If it's private, connect GitHub to analyze it.",
      404,
    );
  }
  if (res.status === 403) {
    throw new RepoFetchError("GitHub rate limit reached. Add a GITHUB_TOKEN or retry shortly.", 403);
  }
  if (!res.ok) {
    throw new RepoFetchError(`GitHub request failed (${res.status}).`, res.status);
  }

  return res.json() as Promise<T>;
}

interface RepoMeta {
  description: string | null;
  language: string | null;
  default_branch: string;
}

interface TreeResponse {
  tree: { path: string; type: "blob" | "tree"; size?: number }[];
  truncated: boolean;
}

/**
 * Ranks tree files so the most instructive ones are read first: priority
 * patterns win, then shallower paths (top-level files reveal the most).
 */
function rankFiles(paths: string[]): string[] {
  return paths
    .filter((p) => !IGNORED_DIRS.test(p) && !IGNORED_FILES.test(p))
    .sort((a, b) => {
      const score = (p: string) => {
        const name = p.toLowerCase();
        const priority = PRIORITY_PATTERNS.some((re) => re.test(p) || re.test(name)) ? 0 : 1;
        const depth = p.split("/").length;
        return priority * 100 + depth;
      };
      return score(a) - score(b);
    });
}

async function fetchFile(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  userToken?: string,
): Promise<RepoFile | null> {
  // Private repos need the authenticated contents API; public ones use the raw CDN.
  const res = userToken
    ? await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
        { headers: { ...headers(userToken), Accept: "application/vnd.github.raw+json" } },
      )
    : await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
  if (!res.ok) return null;

  const text = await res.text();
  return {
    path,
    content: text.length > MAX_FILE_BYTES ? `${text.slice(0, MAX_FILE_BYTES)}\n… (truncated)` : text,
  };
}

/**
 * Builds the full PipelineContext for a repository: metadata, the complete file
 * tree for structural reasoning, and the contents of the highest-value files.
 * A user OAuth token (from the connect-GitHub flow) unlocks private repos; it is
 * used per-request only and never persisted server-side.
 */
export async function fetchRepoContext(input: string, userToken?: string): Promise<PipelineContext> {
  const { owner, repo } = parseRepoUrl(input);

  const meta = await github<RepoMeta>(`/repos/${owner}/${repo}`, userToken);
  const treeRes = await github<TreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${meta.default_branch}?recursive=1`,
    userToken,
  );

  const allPaths = treeRes.tree.filter((n) => n.type === "blob").map((n) => n.path);
  const ranked = rankFiles(allPaths);

  const sampled = await Promise.all(
    ranked.slice(0, MAX_FILES).map((path) => fetchFile(owner, repo, path, meta.default_branch, userToken)),
  );

  return {
    owner,
    repo,
    description: meta.description,
    primaryLanguage: meta.language,
    tree: allPaths.filter((p) => !IGNORED_DIRS.test(p)),
    files: sampled.filter((f): f is RepoFile => f !== null),
  };
}
