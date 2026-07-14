import Groq from "groq-sdk";
import { env } from "@/lib/env";

/**
 * Groq runs the high-frequency stages — the four workers and the critic — where
 * fast, inexpensive inference lets us fan out in parallel without a latency hit.
 */
const client = new Groq({ apiKey: env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

export interface GroqCall {
  system: string;
  prompt: string;
  temperature?: number;
}

export interface GroqResponse {
  text: string;
  tokensUsed: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reads the "try again in 12.3s" hint Groq returns on a 429, defaulting to 20s. */
function retryDelayMs(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/try again in ([\d.]+)s/i);
  const seconds = match ? Number(match[1]) : 20;
  return Math.ceil(seconds + 1) * 1000;
}

function isRateLimit(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 429;
}

export async function callGroq(
  { system, prompt, temperature = 0.1 }: GroqCall,
  { maxRetries = 2 }: { maxRetries?: number } = {},
): Promise<GroqResponse> {
  for (let attempt = 0; ; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });

      return {
        text: completion.choices[0]?.message?.content ?? "",
        tokensUsed: completion.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      // The free tier caps tokens-per-minute; wait out the window and retry.
      if (isRateLimit(error) && attempt < maxRetries) {
        await sleep(retryDelayMs(error));
        continue;
      }
      throw error;
    }
  }
}
