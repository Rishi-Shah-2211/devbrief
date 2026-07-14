import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

/**
 * Gemini handles the reasoning-heavy stages — planning the pipeline and
 * synthesizing the final brief — where a large context window matters most.
 */
const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const MODEL = "gemini-2.0-flash";

export interface GeminiCall {
  system: string;
  prompt: string;
  /** Lower for planning (deterministic), higher for prose synthesis. */
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  tokensUsed: number;
}

export async function callGemini({
  system,
  prompt,
  temperature = 0.2,
}: GeminiCall): Promise<GeminiResponse> {
  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature,
    },
  });

  return {
    text: response.text ?? "",
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  };
}
