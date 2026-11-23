import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

if (!fs.existsSync(path.join(root, "package.json")) || !fs.existsSync(path.join(root, "knowledge_base-1.json"))) {
  console.error("Error: Run this script inside the root of your Dermavant repository folder.");
  process.exit(1);
}

const write = (rel, content) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), "utf8");
  console.log("Wrote", rel);
};

const editFile = (rel, fn) => {
  const full = path.join(root, rel);
  const src = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  const next = fn(src, rel);
  fs.writeFileSync(full, next, "utf8");
  console.log("Updated", rel);
};

const replaceExact = (src, target, replacement, label) => {
  if (!src.includes(target)) {
    throw new Error(`Expected snippet not found while updating ${label}: ${target.slice(0, 80)}`);
  }
  return src.replace(target, replacement);
};

// 1. lib/ai/gemini.ts
write(
  "lib/ai/gemini.ts",
  `
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
`
);

// 2. lib/ai/guardrails.ts
write(
  "lib/ai/guardrails.ts",
  `
import { Type, type Schema } from "@google/genai";

export type PossibleCondition = {
  condition: string;
  confidence: number;
  reasoning: string;
};

export type DermatologyResponse = {
  clinicalSummary: string;
  possibleConditions: PossibleCondition[];
  recommendedNextSteps: string;
  followUpGuidance: string;
  confidenceScore: number;
  needsImmediateProfessionalCare: boolean;
};

export function createDermatologyResponseSchema(): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      clinicalSummary: {
        type: Type.STRING,
        description: "Summary of reported skin symptoms and visible features",
      },
      possibleConditions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["condition", "confidence", "reasoning"],
        },
      },
      recommendedNextSteps: {
        type: Type.STRING,
        description: "Recommended non-prescriptive next steps for the patient",
      },
      followUpGuidance: {
        type: Type.STRING,
        description: "Follow-up guidance for monitoring the condition",
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: "Overall model estimate score from 0.0 to 1.0 (not a clinical probability)",
      },
      needsImmediateProfessionalCare: {
        type: Type.BOOLEAN,
        description: "Whether the patient should seek immediate professional care",
      },
    },
    required: [
      "clinicalSummary",
      "possibleConditions",
      "recommendedNextSteps",
      "followUpGuidance",
      "confidenceScore",
      "needsImmediateProfessionalCare",
    ],
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeResponseText(text: string): string {
  return text
    .replace(/^\\s*\`\`\`(?:json|javascript|typescript|txt)?\\s*/i, "")
    .replace(/\\s*\`\`\`\\s*$/i, "")
    .trim();
}

function extractBalancedJsonObject(text: string): unknown {
  const normalized = normalizeResponseText(text);
  const firstBrace = normalized.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("Unable to locate JSON object in model response.");
  }

  const candidate = normalized.substring(firstBrace);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < candidate.length; index += 1) {
    const character = candidate[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(candidate.substring(0, index + 1));
      }
    }
  }

  throw new Error("Unable to locate JSON object in model response.");
}

export function extractJsonFromText(text: string): unknown {
  const normalized = normalizeResponseText(text);
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = normalized.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through to balanced-object scan
    }
  }

  return extractBalancedJsonObject(normalized);
}

export function isValidDermatologyResponse(value: unknown): value is DermatologyResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;

  if (!isNonEmptyString(response.clinicalSummary)) return false;
  if (!isNonEmptyString(response.recommendedNextSteps)) return false;
  if (!isNonEmptyString(response.followUpGuidance)) return false;
  if (typeof response.confidenceScore !== "number" || !Number.isFinite(response.confidenceScore)) return false;
  if (response.confidenceScore < 0 || response.confidenceScore > 1) return false;
  if (typeof response.needsImmediateProfessionalCare !== "boolean") return false;
  if (!Array.isArray(response.possibleConditions) || response.possibleConditions.length === 0) {
    return false;
  }

  return response.possibleConditions.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const conditionItem = item as Record<string, unknown>;
    return (
      isNonEmptyString(conditionItem.condition) &&
      typeof conditionItem.confidence === "number" &&
      Number.isFinite(conditionItem.confidence) &&
      conditionItem.confidence >= 0 &&
      conditionItem.confidence <= 1 &&
      isNonEmptyString(conditionItem.reasoning)
    );
  });
}
`
);

// 3. lib/ai/rag.ts
write(
  "lib/ai/rag.ts",
  `
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
        id: String(item.id || \`kb_\${idx + 1}\`),
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
        id: \`kb_\${idx + 1}\`,
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
    .replace(/[^\\w\\s]/g, "")
    .split(/\\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (words.length === 0) return "";

  const chunks = sourceChunks ?? normalizeKnowledgeBase(knowledgeBase);
  const scored = chunks.map((chunk) => {
    const condLower = chunk.condition.toLowerCase();
    const catLower = chunk.category.toLowerCase();
    const fullText = \`\${condLower} \${catLower} \${chunk.text.toLowerCase()}\`;
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
    .map(({ chunk }) => \`- **[\${chunk.condition} — \${chunk.category}]**: \${chunk.text}\`)
    .join("\\n");
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
        const contents = batch.map((c) => \`\${c.condition} (\${c.category}): \${c.text}\`);
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
          console.error(\`[RAG] Batch embedding failed at offset \${start}:\`, err);
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
      .map(({ chunk }) => \`- **[\${chunk.condition} — \${chunk.category}]**: \${chunk.text}\`)
      .join("\\n");
  } catch (error) {
    console.error("[RAG] Error during vector retrieval, falling back to keyword search:", error);
    return getKeywordFallbackContext(symptoms, topK);
  }
}
`
);

// 4. knowledge_base-1.json (condition-tagged structured array)
const kbRaw = JSON.parse(fs.readFileSync(path.join(root, "knowledge_base-1.json"), "utf8"));
if (!Array.isArray(kbRaw)) {
  const conditionMap = {
    topical: "Contact Dermatitis / Eczema",
    oral: "Lichen Planus",
    general: "Dermatology General",
    key_features: "Bullous Pemphigoid",
    differential_diagnosis: "Bullous Pemphigoid",
    intravenous_IV: "Cellulitis / Severe Bacterial Skin Infection",
    emergency: "Cellulitis / Rapidly Spreading Skin Infection",
    injectable: "Epidermoid Cyst / Inflamed Nodule",
    common_locations: "Post-Inflammatory Hyperpigmentation / Scarring",
    topical_shampoos: "Seborrheic Dermatitis",
    topical_creams: "Seborrheic Dermatitis",
    shampoo_use: "Seborrheic Dermatitis",
    treatment: "Contact Dermatitis",
    common_triggers: "Contact Dermatitis",
    adult: "Suspected Skin Malignancy / Oncology Referral",
    senior: "Psoriasis (Geriatric Monitoring)",
    physical: "Chronic Scarring / Burn / Keloid Sequelae",
    psychological: "Post-Inflammatory Hyperpigmentation (PIH)",
    dark_skin_presentation: "Subungual Melanoma vs. Benign Melanonychia",
    pediatric: "Oculocutaneous Albinism / Sun Protection",
    skin: "Post-Inflammatory Hyperpigmentation (PIH)",
    hair: "Lichen Planopilaris",
    christmas_tree_pattern: "Pityriasis Rosea",
    pregnancy_warning: "Rosacea",
    ocular: "Ocular Rosacea",
    topical_therapy: "Bullous Pemphigoid",
    systemic_oral: "Hidradenitis Suppurativa",
    biologics_injectables: "Hidradenitis Suppurativa",
    social: "Hidradenitis Suppurativa",
    oral_medications: "Epidermoid Cyst (Infected)",
    rupture: "Epidermoid Cyst",
    infection: "Epidermoid Cyst / Abscess",
    recurrence: "Alopecia Areata",
    skin_damage: "Exogenous Ochronosis (Hydroquinone Misuse)",
    permanence: "Post-Inflammatory Hyperpigmentation (PIH)",
    malignancy: "Albinism / Squamous Cell Carcinoma Risk",
    basal_cell_carcinoma: "Basal Cell Carcinoma",
    solar_elastosis: "Chronic UV Sun Damage",
    dark_skin_context: "Albinism & UV Stress in African Communities",
    advanced_treatments: "Melanoma",
    metastasis: "Melanoma",
    clinical_assessment: "Basal Cell Carcinoma",
    biopsy_techniques: "Basal Cell Carcinoma",
    imaging: "Basal Cell Carcinoma (Advanced)",
    topical_agents: "Basal Cell Carcinoma (Superficial)",
    targeted_systemic_therapy: "Basal Cell Carcinoma (Advanced)",
    local_destruction: "Basal Cell Carcinoma",
    perineural_invasion: "Basal Cell Carcinoma / Cutaneous SCC",
    recurrent_disease: "Basal Cell Carcinoma",
    physical_examination: "Nail Pathology / Onychomycosis / Psoriasis",
    biopsy_protocol: "Melanoma / Cutaneous Squamous Cell Carcinoma",
    lymph_node_assessment: "Melanoma / Cutaneous Squamous Cell Carcinoma",
    topical_chemotherapy: "Squamous Cell Carcinoma in situ / Actinic Keratosis",
    systemic_immunotherapy: "Cutaneous Squamous Cell Carcinoma",
    physical_palpation: "Actinic Keratosis",
    dermoscopy: "Vascular Lesions / Cherry Angioma",
    skin_biopsy: "Actinic Keratosis / Rule Out Invasive SCC",
    topical_antimetabolites: "Actinic Keratosis",
    immune_response_modifiers: "Actinic Keratosis",
    malignant_transformation: "Melanocytic Nevi / Dysplastic Nevus",
    field_cancerization: "Actinic Keratosis",
    cosmetic_disfigurement: "Actinic Keratosis",
    clinical_inspection: "Kaposi Sarcoma",
    histopathology: "Kaposi Sarcoma",
    systemic_screening: "Kaposi Sarcoma",
    cd4_count_and_viral_load: "Kaposi Sarcoma (HIV-Associated)",
    antiretroviral_therapy_art: "Kaposi Sarcoma (HIV-Associated)",
    systemic_chemotherapy: "Kaposi Sarcoma",
    topical_and_intralesional: "Kaposi Sarcoma",
    visceral_involvement: "Kaposi Sarcoma",
    lymphedema: "Kaposi Sarcoma",
    secondary_infections: "Kaposi Sarcoma / Ulcerated Lesions",
    ugly_duckling_sign: "Melanoma Screening (Melanocytic Nevi)",
    biopsy: "Scarring Alopecia",
    psychological_distress: "Congenital / Facial Melanocytic Nevi",
    irritation: "Melanocytic Nevi / Raised Lesions",
    topical_treatment: "Seborrheic Keratosis",
    psychological_impact: "Seborrheic Keratosis",
    misdiagnosis: "Seborrheic Keratosis vs. Melanoma / BCC",
    note: "Seborrheic Keratosis / Benign Lesions",
    topical_steroids: "Dermatofibroma",
    cosmetic_concern: "Dermatofibroma",
    scarring: "Dermatofibroma Excision",
    diascopy: "Hemangioma / Vascular Lesion",
    ultrasound_doppler: "Deep Hemangioma",
    infantile_specific: "Infantile Hemangioma",
    topical_for_adults: "Cherry Angioma",
    hemorrhage: "Pyogenic Granuloma / Vascular Lesion",
    ulceration: "Infantile Hemangioma",
    visual_impairment: "Periorbital Hemangioma",
    trichoscopy: "Alopecia Areata",
    blood_tests: "Alopecia Areata",
    first_line_treatment: "Alopecia Areata",
    second_line_treatment: "Alopecia Areata",
    advanced_therapy: "Alopecia Areata (Severe)",
    regrowth_pattern: "Alopecia Areata",
    spontaneous_remission: "Alopecia Areata",
    potassium_hydroxide_koh_test: "Onychomycosis (Fungal Nail Infection)",
    fungal_culture: "Onychomycosis (Fungal Nail Infection)",
    nail_biopsy_pas_stain: "Onychomycosis (Fungal Nail Infection)",
    oral_antifungals: "Onychomycosis (Fungal Nail Infection)",
    topical_lacquers: "Onychomycosis (Fungal Nail Infection)",
    warning_note: "Onychomycosis (Systemic Antifungal Safety)",
    secondary_infection: "Bullous Disease / Raw Skin Barrier",
    permanent_nail_dystrophy: "Onychomycosis",
    pain_and_discomfort: "Onychomycosis",
    immediate_action: "Stevens-Johnson Syndrome (SJS) / TEN",
    hospital_treatment: "Stevens-Johnson Syndrome (SJS) / TEN",
    sepsis: "Stevens-Johnson Syndrome (SJS) / Blistering Emergency",
    blindness: "Stevens-Johnson Syndrome (SJS) / Ocular Emergency",
    organ_failure: "Stevens-Johnson Syndrome (SJS) / TEN",
    death: "Stevens-Johnson Syndrome (SJS) / TEN",
    mucosal_involvement: "Stevens-Johnson Syndrome (SJS) / Pemphigus",
    systemic_therapy: "Bullous Pemphigoid",
    steroid_side_effects: "Bullous Pemphigoid (Long-Term Steroids)",
    dehydration: "Bullous Pemphigoid / Blistering Disorders",
  };

  const structured = Object.entries(kbRaw).map(([key, value], idx) => ({
    id: `kb_${String(idx + 1).padStart(3, "0")}`,
    condition: conditionMap[key] || "General Dermatology",
    category: key.replace(/_/g, " "),
    content: Array.isArray(value) ? value.join("; ") : String(value),
  }));

  const extraEntries = [
    {
      id: "kb_extra_001",
      condition: "Atopic Dermatitis (Eczema)",
      category: "key features",
      content: "Dry, intensely itchy, inflamed patches commonly on flexural creases (behind knees, inside elbows, neck, wrists). In darker skin tones, erythema may appear violaceous, dark brown, or hyperpigmented rather than bright red.",
    },
    {
      id: "kb_extra_002",
      condition: "Tinea Corporis / Tinea Pedis (Fungal Ringworm)",
      category: "key features and red flags",
      content: "Annular (ring-shaped) scaly plaques with an active raised border and central clearing, or macerated itchy skin between toes. Avoid applying over-the-counter topical steroids alone, which can mask and worsen fungal infection (tinea incognito).",
    },
    {
      id: "kb_extra_003",
      condition: "Scabies",
      category: "key features",
      content: "Intense itching typically worse at night, with small papules or burrows in finger webs, wrists, waistline, and groin; often affects close household contacts simultaneously.",
    },
    {
      id: "kb_extra_004",
      condition: "Acne Vulgaris",
      category: "presentation and care",
      content: "Comedones (blackheads/whiteheads), papules, pustules, or deep nodules on face, chest, or upper back. In darker skin, lesions frequently leave post-inflammatory hyperpigmentation; avoid harsh scrubbing or unprescribed bleaching creams.",
    },
    {
      id: "kb_extra_005",
      condition: "Urticaria (Hives) & Angioedema Emergency",
      category: "emergency triage",
      content: "Transient, raised itchy wheals lasting under 24 hours per lesion. Seek immediate emergency care if accompanied by lip/tongue/throat swelling, difficulty breathing, dizziness, or wheezing (anaphylaxis warning).",
    },
  ];

  fs.writeFileSync(
    path.join(root, "knowledge_base-1.json"),
    JSON.stringify([...structured, ...extraEntries], null, 2) + "\n",
    "utf8"
  );
  console.log("Updated knowledge_base-1.json");
}

// 5. app/api/ai/chat/route.ts
write(
  "app/api/ai/chat/route.ts",
  `
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AIReport, Patient, User } from "@/models";
import { getGeminiClient, getGeminiModel, isGeminiConfigured, withGeminiRetry } from "@/lib/ai/gemini";
import {
  createDermatologyResponseSchema,
  extractJsonFromText,
  isValidDermatologyResponse,
} from "@/lib/ai/guardrails";
import { getRelevantKnowledgeContext } from "@/lib/ai/rag";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_SYMPTOM_LENGTH = 2000;

type InlineImage = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
};

function parseImageDataUrl(value: unknown): InlineImage | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Upload a JPEG, PNG, or WebP image.");

  const match = value.match(/^data:(image\\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) throw new Error("Upload a JPEG, PNG, or WebP image.");

  const encoded = match[2];
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 3 MB or smaller.");
  }

  return { mimeType: match[1].toLowerCase() as InlineImage["mimeType"], data: encoded };
}

function buildDermatologyPrompt(symptoms: string, clinicalContext: string, hasImage: boolean): string {
  return \`You are a cautious dermatology triage assistant for Aetheris Health (Dermavant).
Provide preliminary educational triage only — never a definitive medical diagnosis and never prescribe medication.

Rules:
- \${hasImage ? "Describe observable skin features in the uploaded image first, and note photo limitations such as lighting, focus, or skin-tone contrast." : "Work strictly from the symptom description and ask clarifying questions when helpful."}
- State uncertainty plainly. If the available information is limited, return "Insufficient information" as the possible condition and ask for useful details.
- If symptoms or visible signs could indicate a serious problem, rapidly spreading infection, severe allergic reaction, blistering mucosal disease, or other emergency, set needsImmediateProfessionalCare to true and advise urgent professional care.
- Never present model confidence as a medically validated probability.
- Relevant symptoms may include location, appearance, duration, itching, pain, scaling, color changes, nail changes, and hair loss.

\${clinicalContext ? \`Relevant general dermatology reference guidance:\n"""\n\${clinicalContext}\n"""\n\` : ""}
Return only a JSON object matching the required schema.

Input symptoms:
"""
\${symptoms || "No symptom description was provided. Comment on visible features only and state limitations."}
"""\`;
}

async function generateGeminiTriage(prompt: string, image: InlineImage | null, modelName: string): Promise<string> {
  const ai = getGeminiClient();
  const contents = image
    ? {
        parts: [
          { inlineData: { mimeType: image.mimeType, data: image.data } },
          { text: prompt },
        ],
      }
    : prompt;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction:
          "You provide cautious, non-diagnostic dermatology triage. Return only the requested structured JSON.",
        responseMimeType: "application/json",
        responseSchema: createDermatologyResponseSchema(),
      },
    })
  );

  return response.text ?? "";
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const symptoms = String(body.symptoms || body.symptom || "").trim();

    if (symptoms.length > MAX_SYMPTOM_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "Please keep the symptom description under 2,000 characters." },
        { status: 400 }
      );
    }

    let image: InlineImage | null;
    try {
      image = parseImageDataUrl(body.image);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Invalid image upload." },
        { status: 400 }
      );
    }

    if (!symptoms && !image) {
      return NextResponse.json(
        { ok: false, error: "Describe your symptoms or upload an image." },
        { status: 400 }
      );
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json(
        { ok: false, error: "Account not found. Please complete registration first." },
        { status: 404 }
      );
    }

    if (userDoc.role !== "patient") {
      return NextResponse.json(
        { ok: false, error: "Only patients may use dermatology AI consultation." },
        { status: 403 }
      );
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found." }, { status: 404 });
    }

    const modelName = getGeminiModel();
    const knowledgeContext = await getRelevantKnowledgeContext(
      symptoms || "skin concern in uploaded image",
      3
    );
    const prompt = buildDermatologyPrompt(symptoms, knowledgeContext, Boolean(image));
    const rawText = await generateGeminiTriage(prompt, image, modelName);

    if (!rawText) {
      return NextResponse.json(
        { ok: false, error: "The AI service returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(rawText);
    } catch {
      parsedResponse = extractJsonFromText(rawText);
    }

    if (!isValidDermatologyResponse(parsedResponse)) {
      return NextResponse.json(
        { ok: false, error: "The AI service returned an invalid report. Please try again." },
        { status: 502 }
      );
    }

    const report = await AIReport.create({
      patient_id: patientDoc._id as any,
      symptoms_text: symptoms || "Image submitted; no symptom description provided.",
      diagnosis: parsedResponse.possibleConditions.map((condition) => ({
        condition: condition.condition,
        confidence: condition.confidence,
        reasoning: condition.reasoning,
      })),
      confidence_score: parsedResponse.confidenceScore,
      recommendation: parsedResponse.recommendedNextSteps,
      follow_up_guidance: parsedResponse.followUpGuidance,
      needs_immediate_professional_care: parsedResponse.needsImmediateProfessionalCare,
      generated_at: new Date(),
    } as any);

    return NextResponse.json(
      {
        ok: true,
        report: {
          id: report._id.toString(),
          clinicalSummary: parsedResponse.clinicalSummary,
          possibleConditions: parsedResponse.possibleConditions,
          recommendedNextSteps: parsedResponse.recommendedNextSteps,
          followUpGuidance: parsedResponse.followUpGuidance,
          confidenceScore: parsedResponse.confidenceScore,
          needsImmediateProfessionalCare: parsedResponse.needsImmediateProfessionalCare,
          provider: "gemini",
          model: modelName,
          includedImage: Boolean(image),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AI consultation] Failed to process request:", error);
    const message =
      error instanceof Error && error.message.startsWith("Gemini is not configured")
        ? error.message
        : "Unable to complete the consultation right now. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
`
);

// 6. app/api/doctor/research/route.ts
write(
  "app/api/doctor/research/route.ts",
  `
import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, ChatHistory } from "@/models";
import { getGeminiClient, getGeminiModel, isGeminiConfigured, withGeminiRetry } from "@/lib/ai/gemini";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
type ResearchMessage = { role: "user" | "assistant"; content: string };
type ResearchImage = { mimeType: "image/jpeg" | "image/png" | "image/webp"; data: string };

const RESEARCH_SYSTEM_PROMPT = \`You are a medical research assistant for licensed healthcare professionals on the Aetheris Health (Dermavant) platform.

Your role:
- Provide evidence-based medical research summaries, clinical insights, and literature references.
- Assist doctors with differential diagnosis reasoning, treatment protocol reviews, and drug interaction checks.
- Reference current medical guidelines (WHO, CDC, NICE, etc.) when applicable.
- Be precise, structured, and cite sources where possible.
- Use professional medical terminology appropriate for a licensed physician audience.
- When discussing off-label uses or experimental treatments, clearly flag them as such.
- If a topic is outside your knowledge or requires real-time data (e.g., breaking drug recalls), state the limitation.

Format your responses with clear headings, bullet points, and concise paragraphs. Use markdown for structure.
Never invent citations, study titles, or URLs. When you cannot verify a reference, say so and suggest where the doctor can check.
Do not treat this chat as a patient-specific diagnosis. Always include a brief disclaimer that the information is AI-generated and should be verified against primary sources before clinical decision-making.\`;

function parseImage(value: unknown): ResearchImage | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Upload a JPEG, PNG, or WebP image.");
  const match = value.match(/^data:(image\\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) throw new Error("Upload a JPEG, PNG, or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 3 MB or smaller.");
  }
  return { mimeType: match[1].toLowerCase() as ResearchImage["mimeType"], data: match[2] };
}

async function generateGeminiAnswer(
  messages: ResearchMessage[],
  image: ResearchImage | null,
  modelName: string
): Promise<string> {
  const ai = getGeminiClient();
  const systemInstruction = image
    ? \`\${RESEARCH_SYSTEM_PROMPT}\nFor an attached image, describe observable features and limitations first. Do not identify a definitive diagnosis from an image alone.\`
    : RESEARCH_SYSTEM_PROMPT;

  const history = messages.slice(0, -1).map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.content }],
  }));

  const chat = ai.chats.create({
    model: modelName,
    history,
    config: {
      systemInstruction,
    },
  });

  const lastMessage = messages[messages.length - 1];
  const messagePayload = image
    ? [
        { text: lastMessage.content || "Please analyze observable dermatologic features in this clinical image." },
        { inlineData: { mimeType: image.mimeType, data: image.data } },
      ]
    : lastMessage.content;

  const response = await withGeminiRetry(() => chat.sendMessage({ message: messagePayload }));
  return response.text ?? "";
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment.", retryable: false },
        { status: 503 }
      );
    }

    const body = await req.json();
    const rawMessages = body.messages;
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 40) {
      return NextResponse.json({ ok: false, error: "Provide between 1 and 40 chat messages." }, { status: 400 });
    }

    const messages = rawMessages as ResearchMessage[];
    if (
      messages.some(
        (message) =>
          !message ||
          !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" ||
          message.content.length > 5000
      ) ||
      messages[messages.length - 1].role !== "user"
    ) {
      return NextResponse.json({ ok: false, error: "The research message format is invalid." }, { status: 400 });
    }

    let image: ResearchImage | null;
    try {
      image = parseImage(body.image);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Invalid image upload." },
        { status: 400 }
      );
    }

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json(
        { ok: false, error: "Only doctors can use the research assistant" },
        { status: 403 }
      );
    }

    const modelName = getGeminiModel();
    const responseText = await generateGeminiAnswer(messages, image, modelName);

    if (!responseText) {
      return NextResponse.json(
        { ok: false, error: "The research service returned an empty response.", retryable: true },
        { status: 502 }
      );
    }

    const lastUserMsg = messages[messages.length - 1];
    const title = lastUserMsg?.content?.slice(0, 50) || "Research conversation";

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      await ChatHistory.updateOne(
        { _id: new mongoose.Types.ObjectId(conversationId), user_id: userDoc._id } as any,
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: lastUserMsg.content },
                { role: "assistant", content: responseText },
              ],
            },
          },
        }
      ).catch(() => {});

      return NextResponse.json({
        ok: true,
        response: responseText,
        conversationId,
        provider: "gemini",
        model: modelName,
      });
    }

    const newChat = await ChatHistory.create({
      user_id: userDoc._id,
      role: "doctor",
      title,
      messages: [
        { role: "user", content: lastUserMsg.content },
        { role: "assistant", content: responseText },
      ],
    } as any).catch(() => null);

    return NextResponse.json({
      ok: true,
      response: responseText,
      conversationId: newChat?._id?.toString?.() || newChat?._id,
      provider: "gemini",
      model: modelName,
    });
  } catch (error: any) {
    console.error("[DOCTOR RESEARCH] Error:", error?.message || String(error));
    return NextResponse.json(
      { ok: false, error: "The research service could not process your request.", retryable: true },
      { status: 502 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Only doctors can access research history" }, { status: 403 });
    }

    const conversations = await ChatHistory.find({ user_id: userDoc._id, role: "doctor" } as any)
      .sort({ updated_at: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      ok: true,
      conversations: conversations.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        messages: c.messages || [],
        updatedAt: c.updated_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
`
);

// 7. Payment, security & Mongoose ObjectId fixes
editFile("lib/paystack.ts", (src, rel) => {
  let out = src.includes('import mongoose from "mongoose";') ? src : `import mongoose from "mongoose";\n` + src;
  out = replaceExact(
    out,
    `  const appointment = await Appointment.findOne({
    $or: [
      { _id: params.appointmentIdentifier },
      { appointment_id: params.appointmentIdentifier },
      { _id: referenceAppointmentId },
      { appointment_id: referenceAppointmentId },
    ],
  });`,
    `  const aptOrFilters: Record<string, unknown>[] = [];
  if (params.appointmentIdentifier) {
    if (mongoose.Types.ObjectId.isValid(params.appointmentIdentifier)) {
      aptOrFilters.push({ _id: params.appointmentIdentifier });
    }
    aptOrFilters.push({ appointment_id: params.appointmentIdentifier });
  }
  if (referenceAppointmentId) {
    if (mongoose.Types.ObjectId.isValid(referenceAppointmentId)) {
      aptOrFilters.push({ _id: referenceAppointmentId });
    }
    aptOrFilters.push({ appointment_id: referenceAppointmentId });
  }
  if (aptOrFilters.length === 0) {
    return null;
  }
  const appointment = await Appointment.findOne({ $or: aptOrFilters } as any);`,
    rel
  );

  out = replaceExact(
    out,
    `  const order = await PharmacyOrder.findOne({
    $or: [
      { _id: params.orderIdentifier },
      { order_id: params.orderIdentifier },
      { _id: referenceOrderId },
      { order_id: referenceOrderId },
    ],
  });`,
    `  const orderOrFilters: Record<string, unknown>[] = [];
  if (params.orderIdentifier) {
    if (mongoose.Types.ObjectId.isValid(params.orderIdentifier)) {
      orderOrFilters.push({ _id: params.orderIdentifier });
    }
    orderOrFilters.push({ order_id: params.orderIdentifier });
  }
  if (referenceOrderId) {
    if (mongoose.Types.ObjectId.isValid(referenceOrderId)) {
      orderOrFilters.push({ _id: referenceOrderId });
    }
    orderOrFilters.push({ order_id: referenceOrderId });
  }
  if (orderOrFilters.length === 0) {
    return null;
  }
  const order = await PharmacyOrder.findOne({ $or: orderOrFilters } as any);`,
    rel
  );
  return out;
});

editFile("app/api/payment/paystack/init/route.ts", (src, rel) => {
  let out = src.includes('import mongoose from "mongoose";') ? src : `import mongoose from "mongoose";\n` + src;
  out = replaceExact(
    out,
    `      // Recalculate total from DB to prevent price tampering
      const medicineIds = items.map((item: any) => item.medicineId);
      const dbMedicines = await Medicine.find({ _id: { $in: medicineIds } as any }).lean();
      const medicineMap = new Map(dbMedicines.map((m: any) => [m._id.toString(), m]));

      let totalAmount = 0;
      const validatedItems = items.map((item: any) => {
        const dbMed = medicineMap.get(item.medicineId);
        const unitPrice = dbMed?.price ?? 0;
        const qty = Number(item.qty) || 1;
        totalAmount += unitPrice * qty;
        return {
          medicine_id: item.medicineId,
          name: dbMed?.name || item.name,
          qty,
          unit_price: unitPrice,
        };
      });`,
    `      // Recalculate total from DB to prevent price/quantity tampering
      const medicineIds = items
        .map((item: any) => String(item?.medicineId || ""))
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id));
      if (medicineIds.length !== items.length) {
        return NextResponse.json({ ok: false, error: "One or more medicine IDs are invalid" }, { status: 400 });
      }
      const dbMedicines = await Medicine.find({ _id: { $in: medicineIds } as any, status: { $ne: "delisted" } }).lean();
      const medicineMap = new Map(dbMedicines.map((m: any) => [m._id.toString(), m]));

      let totalAmount = 0;
      const validatedItems = [];
      for (const item of items) {
        const dbMed = medicineMap.get(String(item.medicineId));
        if (!dbMed || typeof dbMed.price !== "number" || dbMed.price <= 0) {
          return NextResponse.json({ ok: false, error: "One or more medicines are unavailable" }, { status: 400 });
        }
        const qty = Number(item.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
          return NextResponse.json({ ok: false, error: "Item quantities must be positive whole numbers" }, { status: 400 });
        }
        if (typeof dbMed.quantity === "number" && dbMed.quantity < qty) {
          return NextResponse.json({ ok: false, error: \`Insufficient stock for \${dbMed.name}\` }, { status: 400 });
        }
        totalAmount += dbMed.price * qty;
        validatedItems.push({
          medicine_id: item.medicineId,
          name: dbMed.name,
          qty,
          unit_price: dbMed.price,
        });
      }`,
    rel
  );
  out = replaceExact(
    out,
    `      const appointment = await Appointment.findOne({
        $or: [{ _id: appointmentIdentifier }, { appointment_id: appointmentIdentifier }],
      }).lean();`,
    `      const aptQuery = mongoose.Types.ObjectId.isValid(String(appointmentIdentifier))
        ? { $or: [{ _id: appointmentIdentifier }, { appointment_id: appointmentIdentifier }] }
        : { appointment_id: appointmentIdentifier };
      const appointment = await Appointment.findOne(aptQuery as any).lean();`,
    rel
  );
  out = replaceExact(
    out,
    `    const appUrl = process.env.NEXT_PUBLIC_APP_URL || \`https://\${req.headers.get("host")}\`;
    const callbackBase = callbackUrl || \`\${appUrl}/patient/dashboard/payment/success\`;
    const callbackUrlWithReference = new URL(callbackBase, appUrl);`,
    `    const appUrl = process.env.NEXT_PUBLIC_APP_URL || \`https://\${req.headers.get("host")}\`;
    const defaultCallback = \`\${appUrl}/patient/dashboard/payment/success\`;
    let callbackUrlWithReference = new URL(defaultCallback);
    if (callbackUrl) {
      try {
        const candidate = new URL(String(callbackUrl), appUrl);
        if (candidate.origin === new URL(appUrl).origin) {
          callbackUrlWithReference = candidate;
        }
      } catch {
        // Ignore malformed callbackUrl and keep safe default
      }
    }`,
    rel
  );
  return out;
});

editFile("app/api/payment/paystack/verify/route.ts", (src, rel) => {
  let out = src.includes('@clerk/nextjs/server') ? src : `import { auth } from "@clerk/nextjs/server";\n` + src;
  out = replaceExact(
    out,
    `export async function POST(req: Request) {\n  try {`,
    `export async function POST(req: Request) {\n  try {\n    const { userId } = await auth();\n    if (!userId) {\n      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });\n    }`,
    rel
  );
  out = replaceExact(
    out,
    `          error: isNotFound ? "Transaction not found on Paystack. If you completed payment, your wallet will be credited shortly." : (data.message || "Unable to verify payment"),\n          details: data,`,
    `          error: isNotFound ? "Transaction not found on Paystack. If you completed payment, your wallet will be credited shortly." : (data.message || "Unable to verify payment"),`,
    rel
  );
  return out;
});

editFile("app/api/doctors/route.ts", (src, rel) =>
  replaceExact(
    src,
    `              fullName: user.fullName,\n              email: user.email,\n              imageUrl: user.profilePhoto,`,
    `              fullName: user.fullName,\n              imageUrl: user.profilePhoto,`,
    rel
  )
);

editFile("app/api/appointments/route.ts", (src, rel) => {
  let out = src.includes('import mongoose from "mongoose";') ? src : `import mongoose from "mongoose";\n` + src;
  out = replaceExact(
    out,
    `    const query: any = { $or: [{ _id: appointmentId }, { appointment_id: appointmentId }] };`,
    `    const query: any = mongoose.Types.ObjectId.isValid(String(appointmentId))\n      ? { $or: [{ _id: appointmentId }, { appointment_id: appointmentId }] }\n      : { appointment_id: appointmentId };`,
    rel
  );
  out = replaceExact(
    out,
    `    const doctorDoc = await Doctor.findById(doctorId as any).lean();`,
    `    if (!mongoose.Types.ObjectId.isValid(String(doctorId))) {\n      return NextResponse.json({ ok: false, error: "Invalid doctorId" }, { status: 400 });\n    }\n    const doctorDoc = await Doctor.findById(doctorId as any).lean();`,
    rel
  );
  return out;
});

editFile("app/api/payment/wallet/route.ts", (src, rel) => {
  let out = src.includes('import mongoose from "mongoose";') ? src : `import mongoose from "mongoose";\n` + src;
  out = replaceExact(
    out,
    `      const appointment = await Appointment.findOne({\n        $or: [{ _id: appointmentId }, { appointment_id: appointmentId }],\n        patient_id: patient._id as any,\n      } as any);`,
    `      const aptFilter = mongoose.Types.ObjectId.isValid(String(appointmentId))\n        ? { $or: [{ _id: appointmentId }, { appointment_id: appointmentId }] }\n        : { appointment_id: appointmentId };\n      const appointment = await Appointment.findOne({\n        ...aptFilter,\n        patient_id: patient._id as any,\n      } as any);`,
    rel
  );
  out = replaceExact(
    out,
    `      const order = await PharmacyOrder.findOne({\n        $or: [{ _id: orderId }, { order_id: orderId }],\n        patient_id: patient._id as any,\n      } as any);`,
    `      const orderFilter = mongoose.Types.ObjectId.isValid(String(orderId))\n        ? { $or: [{ _id: orderId }, { order_id: orderId }] }\n        : { order_id: orderId };\n      const order = await PharmacyOrder.findOne({\n        ...orderFilter,\n        patient_id: patient._id as any,\n      } as any);`,
    rel
  );
  return out;
});

// 8. UI, DevFest Yola, Sanusi Shafii & Free Google Tools updates
write(
  "components/shared/DevFestBanner.tsx",
  `
import { Sparkles } from "lucide-react";

export function DevFestBanner() {
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <div className="border-b border-white/10 bg-[#081a2c] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:text-sm">
        <Sparkles className="h-4 w-4 text-[#8ab4f8]" aria-hidden="true" />
        <span className="font-semibold">GDG Yola DevFest 2026 Demo</span>
        <span className="hidden text-white/45 sm:inline">·</span>
        <span className="text-white/75">
          Dermavant (Aetheris Health) — Free Google Gemini multimodal skin triage
        </span>
      </div>
    </div>
  );
}
`
);

write(
  "components/patient/DevFestToolsCard.tsx",
  `
import { Brain, FlaskConical, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function DevFestToolsCard() {
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <Card className="max-w-5xl border border-[#8ab4f8]/20 bg-gradient-to-br from-[#0b1b2b] to-[var(--bg-card)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#8ab4f8]/10 p-2 text-[#8ab4f8]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ab4f8]">
            Free Google tools powering this demo
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Patient skin triage, RAG embeddings, and the doctor research assistant run exclusively on free-tier Google AI tools.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <Brain className="h-4 w-4 text-[#8ab4f8]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Gemini API (Free Tier)</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Multimodal skin-image analysis, structured symptom triage, Gemini Embeddings RAG, and doctor research chat.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <Sparkles className="h-4 w-4 text-[#fbbc04]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google AI Studio</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Prompt design, structured JSON schema prototyping, and free API key provisioning.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <FlaskConical className="h-4 w-4 text-[#81c995]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google Colab / Kaggle T4</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Open EfficientNet-B0 dermatology CNN research notebooks (clinician-review baselines, separate from live triage).
          </p>
        </div>
      </div>
    </Card>
  );
}
`
);

write(
  "app/patient/dashboard/start-ai-consultation/page.tsx",
  `
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AIConsultationTabs } from "@/components/patient/AIConsultationTabs";
import { DevFestToolsCard } from "@/components/patient/DevFestToolsCard";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function StartAIConsultationPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="AI Dermatology Consultation"
          description="Explore free Google Gemini-powered skin image and symptom triage. This GDG Yola DevFest demonstration offers preliminary information, not a medical diagnosis."
        />
        <DevFestToolsCard />
        <AIConsultationTabs />
      </div>
    </PortalDashboardShell>
  );
}
`
);

write(
  "app/doctor/research-chat/page.tsx",
  `
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { ResearchChat } from "@/components/doctor/ResearchChat";
import { doctorNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function DoctorResearchChatPage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <ResearchChat />
    </PortalDashboardShell>
  );
}
`
);

editFile("components/patient/AIConsultationTabs.tsx", (src, rel) => {
  let out = src;
  out = out.replace(/interface AIConsultationTabsProps \{\s*aiProvider: "gemini" \| "groq";\s*\}\s*/m, "");
  out = replaceExact(out, "export function AIConsultationTabs({ aiProvider }: AIConsultationTabsProps)", "export function AIConsultationTabs()", rel);
  out = replaceExact(out, "<AIConsultationWizard aiProvider={aiProvider} />", "<AIConsultationWizard />", rel);
  return out;
});

editFile("components/patient/AIConsultationWizard.tsx", (src, rel) => {
  let out = src;
  out = replaceExact(out, '  provider: "gemini" | "groq";', '  provider: "gemini";', rel);
  out = replaceExact(out, 'export function AIConsultationWizard({ aiProvider }: { aiProvider: "gemini" | "groq" })', "export function AIConsultationWizard()", rel);
  out = replaceExact(out, '{aiProvider === "gemini" ? <button', "<button", rel);
  out = replaceExact(out, "              </button> : null}", "              </button>", rel);
  out = replaceExact(
    out,
    '{aiProvider === "gemini" ? <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Image upload</span> : null}',
    '<span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Image upload</span>',
    rel
  );
  out = replaceExact(
    out,
    `              {result.provider === "gemini" ? (
                <span className="rounded-full border border-[#8ab4f8]/25 bg-[#8ab4f8]/10 px-3 py-1 text-xs font-medium text-[#8ab4f8]">
                  Powered by Gemini · {result.model}
                </span>
              ) : (
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  Powered by Groq · {result.model}
                </span>
              )}`,
    `              <span className="rounded-full border border-[#8ab4f8]/25 bg-[#8ab4f8]/10 px-3 py-1 text-xs font-medium text-[#8ab4f8]">
                Powered by Google Gemini · {result.model}
              </span>`,
    rel
  );
  return out;
});

editFile("components/doctor/ResearchChat.tsx", (src, rel) => {
  let out = src;
  out = replaceExact(out, 'export function ResearchChat({ aiProvider }: { aiProvider: "gemini" | "groq" })', "export function ResearchChat()", rel);
  out = replaceExact(out, '{aiProvider === "gemini" ? "Gemini" : "Groq"}', "Google Gemini", rel);
  out = replaceExact(out, '{aiProvider === "gemini" ? <button', "<button", rel);
  out = replaceExact(out, "            </button> : null}", "            </button>", rel);
  return out;
});

editFile("app/layout.tsx", (src, rel) => {
  let out = src;
  out = replaceExact(out, '    ? "Aetheris Health — GDG Yola DevFest Demo"', '    ? "Dermavant (Aetheris Health) — GDG Yola DevFest 2026"', rel);
  out = replaceExact(
    out,
    '      ? "A community demo for GDG Yola DevFest, featuring Gemini-powered visual skin triage."',
    '      ? "Built by Sanusi Shafii for GDG Yola DevFest 2026, powered by free Google Gemini multimodal skin triage."',
    rel
  );
  out = replaceExact(out, '    title: devFestMode ? "Aetheris DevFest" : "Aetheris Health",', '    title: devFestMode ? "Dermavant DevFest" : "Dermavant (Aetheris Health)",', rel);
  return out;
});

editFile("app/page.tsx", (src, rel) => {
  let out = src;
  out = replaceExact(out, '  const contactAddress = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Abuja, Nigeria";', '  const contactAddress = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Yola, Adamawa State, Nigeria";', rel);
  out = replaceExact(out, '  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Ibrahim Hussaini Danhaire";', '  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Sanusi Shafii";', rel);
  out = replaceExact(out, '  const founderTitle = process.env.NEXT_PUBLIC_FOUNDER_TITLE || "Founder, Danhaire Medical Services";', '  const founderTitle = process.env.NEXT_PUBLIC_FOUNDER_TITLE || "Creator & Technical Lead — Dermavant";', rel);
  out = replaceExact(out, "              NextGen Innovation Challenge 2026 — National Showcase", "              GDG Yola DevFest 2026 Showcase · Powered by Google Gemini", rel);
  out = replaceExact(out, "                Built by Danhaire Medical Services", "                Built by Sanusi Shafii for GDG Yola DevFest", rel);
  out = replaceExact(
    out,
    "              © 2026 Danhaire Medical Services. All rights reserved. Built for the NextGen Innovation Challenge 2026.",
    "              © 2026 Sanusi Shafii · Dermavant (Aetheris Health). Built for GDG Yola DevFest 2026.",
    rel
  );
  return out;
});

editFile("app/privacy/page.tsx", (src, rel) =>
  replaceExact(
    src,
    "Aetheris Health, operated by Danhaire Medical Services, is committed to protecting your privacy.",
    "Dermavant (Aetheris Health), led by Sanusi Shafii, is committed to protecting your privacy.",
    rel
  )
);

editFile("app/terms/page.tsx", (src, rel) =>
  replaceExact(
    src,
    "Aetheris Health, operated by Danhaire Medical Services, is not liable",
    "Dermavant (Aetheris Health), led by Sanusi Shafii, is not liable",
    rel
  )
);

write(
  ".env.production",
  `
# Public environment variables (safe to commit — these are exposed to the browser)

# App URL for Paystack callbacks
NEXT_PUBLIC_APP_URL=https://aetheris-health-x36u.vercel.app

# GDG Yola DevFest showcase mode
NEXT_PUBLIC_DEVFEST_MODE=true

# Contact/project details for the landing page
NEXT_PUBLIC_COMPANY_NAME=Dermavant (Aetheris Health)
NEXT_PUBLIC_COMPANY_TAGLINE=AI Dermatology & Digital Healthcare Ecosystem
NEXT_PUBLIC_CONTACT_EMAIL=sanusishafii989@gmail.com
NEXT_PUBLIC_CONTACT_PHONE=+234 800 000 0000
NEXT_PUBLIC_CONTACT_ADDRESS=Yola, Adamawa State, Nigeria
NEXT_PUBLIC_FOUNDER_NAME=Sanusi Shafii
NEXT_PUBLIC_FOUNDER_TITLE=Creator & Technical Lead — GDG Yola DevFest 2026
NEXT_PUBLIC_SOCIAL_GITHUB=https://github.com/sanusishafii989/Dermavant
NEXT_PUBLIC_SOCIAL_TWITTER=
NEXT_PUBLIC_SOCIAL_LINKEDIN=
NEXT_PUBLIC_SOCIAL_INSTAGRAM=

# Paystack (test keys — safe for development/demo)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_15502111ced19bb964f1ee580b90944357ea6fd2

# Clerk (public key — safe to commit, secret key must be set on deployment dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGVhZGluZy1lZ3JldC0yMy5jbGVyay5hY2NvdW50cy5kZXYk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Clerk redirect — role-based after login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/redirect
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/redirect

# Server-side credentials (GEMINI_API_KEY, MONGODB_URI, CLERK_SECRET_KEY, PAYSTACK_SECRET_KEY)
# belong in deployment Environment Variables or .env.local, never this file.
`
);

// 9. Config, types, dependencies, docs & unit tests
write(
  "global.d.ts",
  `
declare module "*.css";
declare module "*.png" {
  const src: string | { src: string };
  export default src;
}
declare module "*.jpg" {
  const src: string | { src: string };
  export default src;
}
declare module "*.jpeg" {
  const src: string | { src: string };
  export default src;
}
declare module "*.webp" {
  const src: string | { src: string };
  export default src;
}
declare module "*.svg" {
  const src: string | { src: string };
  export default src;
}
`
);

write(
  ".eslintrc.cjs",
  `
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/", "out/", "build/", "next-env.d.ts", "build-output.txt", "mobile/"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
`
);

const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = "dermavant";
pkg.description = "Dermavant (Aetheris Health) — Free Google Gemini-powered dermatology triage & digital healthcare ecosystem for GDG Yola DevFest 2026";
pkg.author = "Sanusi Shafii";
delete pkg.dependencies["@google/generative-ai"];
delete pkg.dependencies["groq-sdk"];
pkg.dependencies["@google/genai"] = "^2.4.0";
pkg.devDependencies["tsx"] = "^4.21.0";
pkg.scripts = {
  ...pkg.scripts,
  test: "tsx --test tests/unit/*.test.ts",
  typecheck: "tsc --noEmit",
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("Updated package.json");

write(
  "tests/unit/guardrails.test.ts",
  `
import test from "node:test";
import assert from "node:assert/strict";
import {
  createDermatologyResponseSchema,
  extractJsonFromText,
  isValidDermatologyResponse,
} from "../../lib/ai/guardrails";

test("createDermatologyResponseSchema includes required fields", () => {
  const schema = createDermatologyResponseSchema();
  assert.equal(schema.type, "OBJECT");
  assert.ok(Array.isArray(schema.required));
  assert.ok(schema.required.includes("clinicalSummary"));
  assert.ok(schema.required.includes("possibleConditions"));
  assert.ok(schema.required.includes("needsImmediateProfessionalCare"));
});

test("extractJsonFromText parses markdown-fenced and prefixed JSON", () => {
  const raw = \`Here is the report:\\n\\\`\\\`\\\`json\\n{"clinicalSummary":"Itchy scaly plaque","possibleConditions":[{"condition":"Tinea corporis","confidence":0.6,"reasoning":"Ring-like scaly edge"}],"recommendedNextSteps":"Consult a clinician","followUpGuidance":"Seek care if spreading","confidenceScore":0.6,"needsImmediateProfessionalCare":false}\\n\\\`\\\`\\\`\`;
  const parsed = extractJsonFromText(raw);
  assert.equal(isValidDermatologyResponse(parsed), true);
});

test("isValidDermatologyResponse rejects out-of-range confidence or empty conditions", () => {
  assert.equal(
    isValidDermatologyResponse({
      clinicalSummary: "Summary",
      possibleConditions: [],
      recommendedNextSteps: "Next",
      followUpGuidance: "Follow up",
      confidenceScore: 0.5,
      needsImmediateProfessionalCare: false,
    }),
    false
  );

  assert.equal(
    isValidDermatologyResponse({
      clinicalSummary: "Summary",
      possibleConditions: [{ condition: "Eczema", confidence: 1.5, reasoning: "Invalid" }],
      recommendedNextSteps: "Next",
      followUpGuidance: "Follow up",
      confidenceScore: 0.5,
      needsImmediateProfessionalCare: false,
    }),
    false
  );
});
`
);

write(
  "tests/unit/rag.test.ts",
  `
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  cosineSimilarity,
  getKeywordFallbackContext,
  normalizeKnowledgeBase,
} from "../../lib/ai/rag";

test("knowledge_base-1.json entries are structured and condition-tagged", () => {
  const kbPath = path.join(process.cwd(), "knowledge_base-1.json");
  const raw = JSON.parse(fs.readFileSync(kbPath, "utf8"));
  assert.equal(Array.isArray(raw), true);
  const chunks = normalizeKnowledgeBase(raw);
  assert.ok(chunks.length >= 100);
  for (const chunk of chunks) {
    assert.ok(chunk.condition.length > 0);
    assert.ok(chunk.category.length > 0);
    assert.ok(chunk.text.length > 0);
  }
});

test("cosineSimilarity handles identical, orthogonal, and mismatched vectors", () => {
  assert.equal(Math.round(cosineSimilarity([1, 0], [1, 0]) * 1000), 1000);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [1, 0, 0]), 0);
});

test("getKeywordFallbackContext returns condition-attributed guidance", () => {
  const context = getKeywordFallbackContext("itchy ringworm scaly plaque between toes", 3);
  assert.ok(context.length > 0);
  assert.ok(context.includes("Tinea"));
});
`
);

write(
  "DEVFEST_TEMPORARY_SETUP.md",
  `
# GDG Yola DevFest 2026 Setup — Dermavant

Built by **Sanusi Shafii** for **GDG Yola DevFest 2026**.  
This project is designed to run on **100% free-tier Google AI tools** alongside free-tier web infrastructure.

## Free Google Tools Stack

1. **Google Gemini API (Free Tier via Google AI Studio)**
   - Multimodal skin image + symptom triage (\`/api/ai/chat\`)
   - Doctor clinical research chat (\`/api/doctor/research\`)
   - Grounded dermatology RAG embeddings (\`gemini-embedding-2\` over \`knowledge_base-1.json\`)
2. **Google AI Studio**
   - Prompt design, structured JSON schema validation, and free API key provisioning
3. **Google Colab / Kaggle (Free T4 GPU)**
   - Open EfficientNet-B0 dermatology CNN research notebooks under \`notebooks/\` (clinician-review baselines, kept separate from live triage)

## Environment Variables

Set these variables in your deployment or local \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_DEVFEST_MODE=true
GEMINI_API_KEY=your_server_side_google_ai_studio_key
GEMINI_MODEL=gemini-4-hydrogen
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
\`\`\`

- Keep \`GEMINI_API_KEY\` server-side only (never prefix with \`NEXT_PUBLIC_\` or commit it).
- Patient consultation accepts JPEG, PNG, and WebP images up to 3 MB.
- Results are preliminary educational triage and **not** a medical diagnosis.

## Toggling DevFest Showcase Mode

To hide the DevFest banner and Google tools showcase card while keeping the platform active, set:

\`\`\`env
NEXT_PUBLIC_DEVFEST_MODE=false
\`\`\`

Rebuild/redeploy after changing \`NEXT_PUBLIC_DEVFEST_MODE\`.
`
);

write(
  "README.md",
  `
# Dermavant (Aetheris Health)

**Free Google Gemini-Powered Dermatology Triage & Digital Healthcare Ecosystem** — connecting patients to preliminary multimodal skin triage, licensed doctors, nearby clinics/pharmacies, and verified medicine in one platform.

**Author / Technical Lead:** Sanusi Shafii  
**Showcase Event:** GDG Yola DevFest 2026

---

## Overview

Access to dermatologists and verified medication is severely limited across many communities in Northern Nigeria and underserved regions. **Dermavant** combines free-tier Google AI tooling with a role-based digital health platform containing four access-controlled portals (**Patient**, **Doctor**, **E-Pharmacy Partner**, and **Admin**).

### Free Google Tools Architecture

Dermavant's AI and ML workflows depend exclusively on **free-tier Google tools**:

| Tool | Role in Dermavant |
|---|---|
| **Google Gemini API (Free Tier)** | Multimodal skin image + text triage (\`gemini-4-hydrogen\`), structured JSON guardrails, and doctor research assistant via \`@google/genai\` |
| **Gemini Embeddings (\`gemini-embedding-2\`)** | Vector RAG retrieval over 120+ condition-tagged dermatology reference chunks in \`knowledge_base-1.json\` |
| **Google AI Studio** | Prompt engineering, \`responseSchema\` prototyping, and free API key management |
| **Google Colab / Kaggle Free T4 GPU** | Experimental EfficientNet-B0 CNN notebooks (\`notebooks/01_isic_lesion_risk_kaggle.ipynb\`, \`notebooks/02_scin_common_triage_kaggle.ipynb\`) for clinician-review research |

> **Supporting free-tier web infrastructure:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Clerk (free tier RBAC), MongoDB Atlas (free tier M0), OpenStreetMap / Leaflet + Nominatim (free open maps & geocoding), and Paystack (test mode).

---

## Core Portals & Implemented Features

- **Patient Portal (\`/patient/*\`):** Multimodal AI dermatology consultation (text + voice input/TTS + image upload up to 3 MB), specialist booking, nearby doctors/pharmacies map discovery, e-pharmacy marketplace, wallet, and medical history with PDF export.
- **Doctor Portal (\`/doctor/*\`):** Appointment management, consultation room, multimodal Google Gemini Medical Research Chat with history, practice location editor, KYC, and earnings wallet.
- **E-Pharmacy Partner Portal (\`/pharmacy/*\`):** Medicine catalogue CRUD, inventory management, order fulfillment, KYC, and earnings wallet.
- **Admin Portal (\`/admin/*\`):** User management, KYC verification, platform stats/revenue, audit logs, and support ticket handling.

---

## Getting Started

\`\`\`bash
git clone https://github.com/sanusishafii989/Dermavant.git
cd Dermavant
npm install
npm run typecheck
npm run lint
npm test
npm run dev
\`\`\`

---

## Author

**Sanusi Shafii** — Creator & Technical Lead  
Built for **GDG Yola DevFest 2026**
`
);

for (const dead of ["app/api/ai/coordinates.ts", "components/PlaceholderPage.tsx", "README_Old.md"]) {
  const p = path.join(root, dead);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log("Removed", dead);
  }
}

console.log("\nAll fixes applied cleanly! Now run: npm install && npm run typecheck && npm run lint && npm test");
