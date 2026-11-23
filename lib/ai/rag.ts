import knowledgeBase from "@/knowledge_base-1.json";
import { getGeminiApiKey, getGeminiClient, getGeminiEmbeddingModel } from "@/lib/ai/gemini";

export type KnowledgeChunk = {
  id: string;
  condition: string;
  category: string;
  text: string;
  embedding?: number[];
};

const EMBED_BATCH_SIZE = 50;
let cachedChunks: KnowledgeChunk[] | null = null;
let embeddingInitPromise: Promise<void> | null = null;

export function normalizeKnowledgeBase(raw: unknown): KnowledgeChunk[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item, idx) => ({
        id: String(item.id || `kb_${idx + 1}`),
        condition: String(item.condition || "General Dermatology").trim(),
        category: String(item.category || "guidance").replace(/_/g, " ").trim(),
        text: Array.isArray(item.content)
          ? item.content.map(String).join("; ")
          : String(item.content ?? item.text ?? "").trim(),
      }))
      .filter((chunk) => chunk.text.length > 0);
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([key, value], idx) => ({
        id: `kb_${idx + 1}`,
        condition: "Dermatology Reference",
        category: key.replace(/_/g, " ").trim(),
        text: Array.isArray(value) ? value.map(String).join("; ") : String(value ?? "").trim(),
      }))
      .filter((chunk) => chunk.text.length > 0);
  }

  return [];
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getKeywordFallbackContext(symptoms: string, topK = 3, sourceChunks?: KnowledgeChunk[]): string {
  const stopWords = new Set([
    "the", "and", "with", "have", "been", "that", "this", "from", "some",
    "like", "over", "skin", "rash", "for", "are", "was", "has", "not",
  ]);
  const words = symptoms
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (words.length === 0) return "";

  const chunks = sourceChunks ?? normalizeKnowledgeBase(knowledgeBase);
  const scored = chunks.map((chunk) => {
    const condLower = chunk.condition.toLowerCase();
    const catLower = chunk.category.toLowerCase();
    const fullText = `${condLower} ${catLower} ${chunk.text.toLowerCase()}`;
    let score = 0;
    for (const word of words) {
      if (fullText.includes(word)) score += 1;
      if (catLower.includes(word)) score += 2;
      if (condLower.includes(word)) score += 3;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.filter((item) => item.score > 0).slice(0, topK);

  if (selected.length === 0) return "";
  return selected
    .map(({ chunk }) => `- **[${chunk.condition} — ${chunk.category}]**: ${chunk.text}`)
    .join("\n");
}

async function ensureEmbeddingsInitialized(): Promise<KnowledgeChunk[]> {
  if (!cachedChunks) {
    cachedChunks = normalizeKnowledgeBase(knowledgeBase);
  }

  if (cachedChunks.some((chunk) => Array.isArray(chunk.embedding))) {
    return cachedChunks;
  }

  if (!embeddingInitPromise) {
    embeddingInitPromise = (async () => {
      const ai = getGeminiClient();
      const model = getGeminiEmbeddingModel();
      const chunks = cachedChunks!;

      for (let start = 0; start < chunks.length; start += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(start, start + EMBED_BATCH_SIZE);
        const contents = batch.map((c) => `${c.condition} (${c.category}): ${c.text}`);
        try {
          const response = await ai.models.embedContent({ model, contents });
          const embeddings = response.embeddings ?? [];
          batch.forEach((chunk, index) => {
            const values = embeddings[index]?.values;
            if (Array.isArray(values) && values.length > 0) {
              chunk.embedding = values;
            }
          });
        } catch (err) {
          console.error(`[RAG] Batch embedding failed at offset ${start}:`, err);
        }
      }
    })();
  }

  await embeddingInitPromise;
  return cachedChunks;
}

export async function getRelevantKnowledgeContext(symptoms: string, topK = 3): Promise<string> {
  if (!getGeminiApiKey()) {
    return getKeywordFallbackContext(symptoms, topK);
  }

  try {
    const chunks = await ensureEmbeddingsInitialized();
    const embeddedChunks = chunks.filter(
      (chunk): chunk is KnowledgeChunk & { embedding: number[] } => Array.isArray(chunk.embedding)
    );

    if (embeddedChunks.length === 0) {
      return getKeywordFallbackContext(symptoms, topK, chunks);
    }

    const ai = getGeminiClient();
    const queryRes = await ai.models.embedContent({
      model: getGeminiEmbeddingModel(),
      contents: symptoms,
    });
    const queryVector = queryRes.embeddings?.[0]?.values;

    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      return getKeywordFallbackContext(symptoms, topK, chunks);
    }

    const scored = embeddedChunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, topK);

    if (selected.length === 0) {
      return getKeywordFallbackContext(symptoms, topK, chunks);
    }

    return selected
      .map(({ chunk }) => `- **[${chunk.condition} — ${chunk.category}]**: ${chunk.text}`)
      .join("\n");
  } catch (error) {
    console.error("[RAG] Error during vector retrieval, falling back to keyword search:", error);
    return getKeywordFallbackContext(symptoms, topK);
  }
}
