import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-4-hydrogen";
export const DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
export const DEFAULT_GEMINI_TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

export const FALLBACK_GEMINI_TEXT_MODELS = [
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

export const FALLBACK_GEMINI_TRANSCRIBE_MODELS = [
  "gemini-3.5-transcribe",
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

export const FALLBACK_GEMINI_EMBEDDING_MODELS = [
  "gemini-embedding-2",
  "gemini-embedding-001",
  "text-embedding-004",
] as const;

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

export function getGeminiTranscribeModel(): string {
  return process.env.GEMINI_TRANSCRIBE_MODEL?.trim() || DEFAULT_GEMINI_TRANSCRIBE_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to the server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function isModelNotFoundError(error: any): boolean {
  const status = Number(error?.status ?? error?.code);
  const message = String(error?.message || "").toLowerCase();
  if (status === 404) return true;
  return (
    message.includes("not_found") ||
    message.includes("is not found") ||
    message.includes("not supported for generatecontent") ||
    message.includes("not supported for embedcontent") ||
    message.includes("does not exist")
  );
}

export function deduplicateModels(primary: string, fallbacks: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const name of [primary, ...fallbacks]) {
    const clean = name.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      ordered.push(clean);
    }
  }
  return ordered;
}

export async function runWithGeminiModelFallback<T>(
  candidateModels: string[],
  operation: (modelName: string) => Promise<T>
): Promise<{ result: T; model: string }> {
  let lastError: unknown;
  for (let i = 0; i < candidateModels.length; i += 1) {
    const modelName = candidateModels[i];
    try {
      const result = await withGeminiRetry(() => operation(modelName));
      return { result, model: modelName };
    } catch (error) {
      lastError = error;
      if (isModelNotFoundError(error) && i < candidateModels.length - 1) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export function formatGeminiUserError(
  error: unknown,
  fallbackMessage = "Unable to complete the consultation right now. Please try again."
): { status: number; message: string } {
  const errObj = error as { status?: number | string; code?: number | string; message?: string };
  const status = Number(errObj?.status ?? errObj?.code);
  const rawMessage = String(errObj?.message || "");
  const lower = rawMessage.toLowerCase();

  if (rawMessage.startsWith("Gemini is not configured")) {
    return { status: 503, message: rawMessage };
  }
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("permission_denied") ||
    lower.includes("permission denied")
  ) {
    return {
      status: 502,
      message: "Gemini API key was rejected. Check GEMINI_API_KEY in your server environment variables.",
    };
  }
  if (
    status === 429 ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return {
      status: 429,
      message: "Gemini rate limit reached for this free-tier key. Please wait a moment and try again.",
    };
  }
  if (isModelNotFoundError(error)) {
    return {
      status: 502,
      message: "The configured Gemini model is not available for this API key. Remove custom GEMINI_MODEL overrides or verify model access.",
    };
  }
  return { status: 500, message: fallbackMessage };
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
      const status = Number(error?.status ?? error?.code);
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
