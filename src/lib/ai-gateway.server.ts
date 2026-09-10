import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Lovable AI Gateway provider for the AI SDK.
 * Server-only: the API key must never reach the browser.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const CHAT_MODEL = "google/gemini-3.8-flash";

export function requireLovableApiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app yet.");
  return key;
}

/** Extracts the first JSON object from a model response. */
export function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The AI response could not be read. Please try again.");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function friendlyAiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("402")) {
    return new Error("The AI credits for this app have run out. Please top them up to continue.");
  }
  if (message.includes("429")) {
    return new Error("Too many AI requests right now. Please wait a moment and try again.");
  }
  if (message.includes("403")) {
    return new Error("AI access is blocked for this workspace.");
  }
  return new Error(message || "The AI request failed. Please try again.");
}
