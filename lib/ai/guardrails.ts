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
    .replace(/^\s*```(?:json|javascript|typescript|txt)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
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
      } else if (character === "\\") {
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
