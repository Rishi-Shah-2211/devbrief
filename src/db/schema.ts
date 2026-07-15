import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { RepoAnalytics } from "@/orchestrator/types";

/**
 * A generated onboarding brief, persisted so every run gets a permanent,
 * shareable URL (/brief/[id]).
 */
export const briefs = pgTable("briefs", {
  /** Short, URL-friendly id, e.g. "expressjs-express-k3x9qz". */
  id: text("id").primaryKey(),
  repo: text("repo").notNull(),
  description: text("description"),
  brief: text("brief").notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  analytics: jsonb("analytics").$type<RepoAnalytics>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BriefRow = typeof briefs.$inferSelect;
