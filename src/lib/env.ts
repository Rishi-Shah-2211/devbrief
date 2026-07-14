import { z } from "zod";

/**
 * Validates environment variables at startup so a missing key fails fast with a
 * clear message instead of surfacing as an opaque error deep inside an agent call.
 */
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

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}

export const env = parsed.data;
