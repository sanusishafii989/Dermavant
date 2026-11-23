import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-4-hydrogen";
export const DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";

export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  return key || undefined;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_GEMINI_EMBEDDING_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to the server environment.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.code;
      const message = String(error?.message || "").toLowerCase();
      const retryable =
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes("rate") ||
        message.includes("quota") ||
        message.includes("unavailable") ||
        message.includes("timeout");

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
