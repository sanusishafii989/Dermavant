import { SchemaType, type ObjectSchema } from "@google/generative-ai";

export type DermatologyPossibleCondition = {
  condition: string;
  confidence: number;
  reasoning: string;
};

export type DermatologyResponse = {
  clinicalSummary: string;
  possibleConditions: DermatologyPossibleCondition[];
  recommendedNextSteps: string;
  followUpGuidance: string;
  confidenceScore: number;
  needsImmediateProfessionalCare: boolean;
};

export function createDermatologyResponseSchema(): ObjectSchema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      clinicalSummary: {
        type: SchemaType.STRING,
        description: "Short dermatology summary for the patient",
      },
      possibleConditions: {
        type: SchemaType.ARRAY,
        minItems: 1,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            condition: {
              type: SchemaType.STRING,
              description: "Likely dermatological condition name",
            },
            confidence: {
              type: SchemaType.NUMBER,
              description: "Confidence score between 0.0 and 1.0",
            },
            reasoning: {
              type: SchemaType.STRING,
              description: "Short reasoning for why this condition is possible",
            },
          },
          required: ["condition", "confidence", "reasoning"],
        },
      },
      recommendedNextSteps: {
        type: SchemaType.STRING,
        description: "Recommended next steps for the patient",
      },
      followUpGuidance: {
        type: SchemaType.STRING,
        description: "Follow-up guidance for monitoring the condition",
      },
      confidenceScore: {
        type: SchemaType.NUMBER,
        description: "Overall confidence score from 0.0 to 1.0",
      },
      needsImmediateProfessionalCare: {
        type: SchemaType.BOOLEAN,
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
      // fall through to a balanced-object scan below
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
  if (typeof response.confidenceScore !== "number") return false;
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
      conditionItem.confidence >= 0 &&
      conditionItem.confidence <= 1 &&
      isNonEmptyString(conditionItem.reasoning)
    );
  });
}
