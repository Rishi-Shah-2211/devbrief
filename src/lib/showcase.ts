import type { RepoAnalytics } from "@/orchestrator/types";
import express from "@/data/showcase/expressjs-express.json";
import axios from "@/data/showcase/axios-axios.json";
import slugify from "@/data/showcase/sindresorhus-slugify.json";

/**
 * Pre-computed briefs for well-known repositories. Statically imported so the
 * showcase always works — instantly, offline from any LLM, at zero quota.
 */
export interface ShowcaseEntry {
  slug: string;
  repo: string;
  description: string | null;
  brief: string;
  tokensUsed: number;
  analytics: RepoAnalytics;
  generatedAt: string;
}

export const SHOWCASE: ShowcaseEntry[] = [express, axios, slugify] as ShowcaseEntry[];

export const getShowcaseEntry = (slug: string): ShowcaseEntry | undefined =>
  SHOWCASE.find((e) => e.slug === slug);
