import { env } from "@/lib/env";

/**
 * Unified multi-provider LLM layer.
 *
 * All three providers speak the OpenAI chat-completions dialect, so one fetch
 * client covers them. Calls walk a fallback chain: if a provider is missing a
 * key, is rate-limited, or errors, the next one picks up the request — the
 * pipeline never dies because a single free tier ran out.
 */

export interface LLMCall {
  system: string;
  prompt: string;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed: number;
  /** Which provider actually served the call (surfaced in the live UI). */
  provider: ProviderName;
}

export type ProviderName = "cerebras" | "groq" | "openrouter";

interface Provider {
  name: ProviderName;
  url: string;
  model: string;
  key: () => string | undefined;
  extraHeaders?: Record<string, string>;
  /** Extra JSON merged into the request body (e.g. OpenRouter's model fallback list). */
  extraBody?: Record<string, unknown>;
}

const PROVIDERS: Record<ProviderName, Provider> = {
  cerebras: {
    name: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    model: "gpt-oss-120b",
    key: () => env.CEREBRAS_API_KEY,
  },
  groq: {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    key: () => env.GROQ_API_KEY,
  },
  openrouter: {
    name: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    // Nemotron Super's 1M context leads; OpenRouter's native `models` list falls
    // through automatically when a free upstream is saturated.
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    extraBody: {
      // OpenRouter caps the fallback list at 3 models.
      models: [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "openai/gpt-oss-20b:free",
      ],
    },
    key: () => env.OPENROUTER_API_KEY,
    extraHeaders: {
      "HTTP-Referer": "https://devbrief-rs.vercel.app",
      "X-Title": "DevBrief",
    },
  },
};

/**
 * Fallback chains, ordered by fit:
 * - Workers want speed and volume → Cerebras first (largest free quota), Groq next.
 * - Synthesis wants a large context window → OpenRouter's free Gemini first.
 */
const WORKER_CHAIN: ProviderName[] = ["cerebras", "groq", "openrouter"];
const SYNTH_CHAIN: ProviderName[] = ["openrouter", "cerebras", "groq"];

class ProviderError extends Error {
  constructor(
    readonly provider: ProviderName,
    readonly status: number,
    message: string,
  ) {
    super(`[${provider} ${status}] ${message}`);
    this.name = "ProviderError";
  }
}

async function callProvider(p: Provider, call: LLMCall): Promise<LLMResponse> {
  const key = p.key();
  if (!key) throw new ProviderError(p.name, 0, "no API key configured");

  const res = await fetch(p.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...p.extraHeaders,
    },
    body: JSON.stringify({
      model: p.model,
      temperature: call.temperature ?? 0.1,
      messages: [
        { role: "system", content: call.system },
        { role: "user", content: call.prompt },
      ],
      ...p.extraBody,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError(p.name, res.status, body.slice(0, 300));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  // Some gateways (OpenRouter) return 200 with an embedded error object.
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new ProviderError(p.name, 200, data.error?.message ?? "empty response");
  }

  return { text, tokensUsed: data.usage?.total_tokens ?? 0, provider: p.name };
}

async function callWithFallback(chain: ProviderName[], call: LLMCall): Promise<LLMResponse> {
  let lastError: unknown;
  for (const name of chain) {
    try {
      return await callProvider(PROVIDERS[name], call);
    } catch (error) {
      lastError = error; // rate limit, missing key, or outage — try the next provider
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("All LLM providers failed or are unconfigured.");
}

/** High-volume, speed-first calls: the four workers and the critic. */
export const callWorkerLLM = (call: LLMCall) => callWithFallback(WORKER_CHAIN, call);

/** Large-context, prose-quality calls: the synthesizer. */
export const callSynthLLM = (call: LLMCall) => callWithFallback(SYNTH_CHAIN, call);
