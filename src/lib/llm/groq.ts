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

export async function callGroq({
  system,
  prompt,
  temperature = 0.1,
}: GroqCall): Promise<GroqResponse> {
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
}
