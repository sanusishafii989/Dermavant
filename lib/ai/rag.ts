import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import knowledgeBase from "@/knowledge_base-1.json";

function getEnvValue(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) {
    return fromProcess;
  }

  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return undefined;
  }

  const envContent = readFileSync(envPath, "utf8");
  const match = envContent.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!match) {
    return undefined;
  }

  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

type KnowledgeChunk = {
  key: string;
  text: string;
  embedding?: number[];
};

let cachedChunks: KnowledgeChunk[] | null = null;
let isEmbeddingInitialized = false;

function getKnowledgeChunks(): KnowledgeChunk[] {
  return Object.entries(knowledgeBase).map(([key, value]) => {
    const readableKey = key.replace(/_/g, " ");
    const textContent = Array.isArray(value) ? value.join("; ") : String(value);
    return {
      key: readableKey,
      text: textContent,
    };
  });
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getKeywordFallbackContext(symptoms: string, topK = 3): string {
  const stopWords = new Set(["the", "and", "with", "have", "been", "that", "this", "from", "some", "like", "over", "knee", "elbow", "skin", "rash"]);
  const words = symptoms
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (words.length === 0) return "";

  const chunks = getKnowledgeChunks();
  const scored = chunks.map((chunk) => {
    const fullText = `${chunk.key} ${chunk.text}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (fullText.includes(word)) score += 1;
      if (chunk.key.toLowerCase().includes(word)) score += 2;
    }
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.filter((item) => item.score > 0).slice(0, topK);

  if (selected.length === 0) return "";

  return selected.map((item) => `- **${item.key}**: ${item.text}`).join("\n");
}

export async function getRelevantKnowledgeContext(symptoms: string, topK = 3): Promise<string> {
  const apiKey = getEnvValue("GEMINI_API_KEY") || getEnvValue("GOOGLE_API_KEY");

  if (!apiKey) {
    return getKeywordFallbackContext(symptoms, topK);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001" });

    if (!cachedChunks) {
      cachedChunks = getKnowledgeChunks();
    }

    if (!isEmbeddingInitialized) {
      // Lazy load embeddings for all knowledge base chunks in parallel
      await Promise.all(
        cachedChunks.map(async (chunk) => {
          try {
            const res = await model.embedContent(`${chunk.key}: ${chunk.text}`);
            chunk.embedding = res.embedding.values;
          } catch (err) {
            console.error(`[RAG] Failed embedding for chunk key '${chunk.key}':`, err);
          }
        })
      );
      isEmbeddingInitialized = true;
    }

    const queryRes = await model.embedContent(symptoms);
    const queryVector = queryRes.embedding.values;

    const scored = cachedChunks
      .filter((chunk): chunk is KnowledgeChunk & { embedding: number[] } => Array.isArray(chunk.embedding))
      .map((chunk) => ({
        key: chunk.key,
        text: chunk.text,
        score: cosineSimilarity(queryVector, chunk.embedding),
      }));

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, topK);

    if (selected.length === 0) {
      return getKeywordFallbackContext(symptoms, topK);
    }

    return selected.map((item) => `- **${item.key}**: ${item.text}`).join("\n");
  } catch (error) {
    console.error("[RAG] Error during vector retrieval, falling back to keyword search:", error);
    return getKeywordFallbackContext(symptoms, topK);
  }
}
