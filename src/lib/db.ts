import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/db/schema";

/**
 * Lazily-created Drizzle client over Neon's pooled endpoint. Persistence is an
 * enhancement, not a requirement: callers treat a missing DATABASE_URL (or a
 * down database) as "no permalink", never as a failed generation.
 */
let client: ReturnType<typeof create> | null = null;

function create() {
  // Neon's pgbouncer pool runs in transaction mode; prepared statements are off.
  const sql = postgres(env.DATABASE_URL!, { prepare: false, max: 1 });
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!env.DATABASE_URL) return null;
  if (!client) client = create();
  return client;
}
