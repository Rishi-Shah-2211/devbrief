import { z } from "zod";

/** Treats blank env vars as absent, so an empty line in .env doesn't fail validation. */
const optional = () =>
  z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const schema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  DATABASE_URL: optional().pipe(z.string().url().optional()),
  GITHUB_TOKEN: optional(),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/**
 * Validates the environment on first access and caches the result. Validation is
 * lazy — not at import time — so a build never fails on missing keys; a misconfigured
 * server instead reports a clear error when an agent actually needs a key.
 */
function load(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Access env vars lazily: `env.GROQ_API_KEY` validates on first use. */
export const env = new Proxy({} as Env, {
  get: (_target, key: string) => load()[key as keyof Env],
});
