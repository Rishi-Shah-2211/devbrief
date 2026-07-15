import type { PipelineContext, RepoAnalytics } from "@/orchestrator/types";

/**
 * Computes code-intelligence metrics purely from the fetched tree and sampled
 * files — no LLM calls, so analytics are free, instant, and deterministic.
 */

const EXT_LANGUAGE: Record<string, string> = {
  ts: "TypeScript", tsx: "TypeScript", mts: "TypeScript", cts: "TypeScript",
  js: "JavaScript", jsx: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
  py: "Python", rb: "Ruby", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin",
  c: "C", h: "C", cpp: "C++", cc: "C++", hpp: "C++", cs: "C#", swift: "Swift",
  php: "PHP", scala: "Scala", ex: "Elixir", exs: "Elixir", dart: "Dart",
  vue: "Vue", svelte: "Svelte", astro: "Astro",
  css: "CSS", scss: "CSS", less: "CSS", html: "HTML",
  md: "Markdown", mdx: "Markdown", json: "JSON", yml: "YAML", yaml: "YAML",
  toml: "TOML", sql: "SQL", sh: "Shell", bash: "Shell", ps1: "PowerShell",
};

function languageOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANGUAGE[ext] ?? "Other";
}

function countDependencies(ctx: PipelineContext): number | null {
  const manifest = ctx.files.find((f) => f.path.toLowerCase().endsWith("package.json"));
  if (!manifest) return null;
  try {
    const pkg = JSON.parse(manifest.content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Object.keys(pkg.dependencies ?? {}).length + Object.keys(pkg.devDependencies ?? {}).length;
  } catch {
    return null;
  }
}

export function computeAnalytics(ctx: PipelineContext): RepoAnalytics {
  const tree = ctx.tree;
  const totalFiles = tree.length;
  const maxDepth = tree.reduce((max, p) => Math.max(max, p.split("/").length), 0);

  // Language share
  const langCounts = new Map<string, number>();
  for (const path of tree) {
    const lang = languageOf(path);
    langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);
  }
  const languages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, files]) => ({
      name,
      files,
      pct: Math.round((files / Math.max(totalFiles, 1)) * 100),
    }));

  // Top first-level directories
  const dirCounts = new Map<string, number>();
  for (const path of tree) {
    const slash = path.indexOf("/");
    if (slash === -1) continue;
    const dir = path.slice(0, slash);
    dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1);
  }
  const topDirs = [...dirCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, files]) => ({ name, files }));

  // Presence signals
  const lower = tree.map((p) => p.toLowerCase());
  const has = (re: RegExp) => lower.some((p) => re.test(p));
  const signals = {
    readme: has(/(^|\/)readme(\.|$)/),
    license: has(/(^|\/)(license|licence|copying)(\.|$)/),
    tests: has(/(^|\/)(tests?|__tests__|spec)(\/|\.)|\.(test|spec)\.[a-z]+$/),
    ci: has(/^\.github\/workflows\//),
    docs: has(/^docs?\//),
    contributing: has(/(^|\/)contributing(\.|$)/),
  };

  // Weighted composite: tests and CI say the most about a codebase's upkeep.
  const healthScore = Math.min(
    100,
    (signals.readme ? 20 : 0) +
      (signals.license ? 10 : 0) +
      (signals.tests ? 25 : 0) +
      (signals.ci ? 20 : 0) +
      (signals.docs ? 10 : 0) +
      (signals.contributing ? 10 : 0) +
      5, // baseline for being fetchable at all
  );

  const onboardingDifficulty: RepoAnalytics["onboardingDifficulty"] =
    totalFiles < 80 && maxDepth <= 4 ? "gentle" : totalFiles < 600 && maxDepth <= 7 ? "moderate" : "steep";

  return {
    totalFiles,
    maxDepth,
    languages,
    topDirs,
    dependencyCount: countDependencies(ctx),
    signals,
    healthScore,
    onboardingDifficulty,
  };
}
