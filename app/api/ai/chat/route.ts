import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AIReport, Patient, User } from "@/models";
import {
  createDermatologyResponseSchema,
  extractJsonFromText,
  isValidDermatologyResponse,
} from "@/lib/ai/guardrails";
import { getRelevantKnowledgeContext } from "@/lib/ai/rag";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_SYMPTOM_LENGTH = 2000;
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

type InlineImage = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
};

function parseImageDataUrl(value: unknown): InlineImage | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Upload a JPEG, PNG, or WebP image.");

  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) throw new Error("Upload a JPEG, PNG, or WebP image.");

  const encoded = match[2];
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 3 MB or smaller.");
  }

  return { mimeType: match[1].toLowerCase() as InlineImage["mimeType"], data: encoded };
}

function buildDermatologyPrompt(symptoms: string, clinicalContext: string, hasImage: boolean) {
  const imageGuidance = hasImage
    ? `A skin image is included. Describe only visible features that can be seen in the image. Image quality, lighting, skin tone, and framing may limit what can be assessed. Do not infer a confirmed disease from appearance alone. Combine visible observations with the user's symptom description where provided.`
    : "Use the user's symptom description only; do not imply that an image was reviewed.";

  return `You are a cautious dermatology triage assistant for a patient-facing health app. You are not a licensed professional and cannot diagnose.
- ${imageGuidance}
- Do not claim to replace a licensed medical professional and do not prescribe medication.
- State uncertainty plainly. If the available information is limited, return "Insufficient information" as the possible condition and ask for useful details.
- If symptoms or visible signs could indicate a serious problem, rapidly spreading infection, severe allergic reaction, or other emergency, advise urgent professional care.
- Never present model confidence as a medically validated probability.
- Relevant symptoms may include location, appearance, duration, itching, pain, scaling, color changes, nail changes, and hair loss.
${clinicalContext ? `
Relevant general health guidance:
"""
${clinicalContext}
"""
` : ""}
Return only a JSON object matching this schema:
{
  "clinicalSummary": "Brief summary of reported symptoms and visible features, if an image was supplied",
  "possibleConditions": [{ "condition": "A possible explanation or Insufficient information", "confidence": 0.1, "reasoning": "Why this is only a possibility" }],
  "recommendedNextSteps": "Practical, non-prescriptive next steps",
  "followUpGuidance": "When and how to seek follow-up",
  "confidenceScore": 0.1,
  "needsImmediateProfessionalCare": false
}

Input symptoms:
"""
${symptoms || "No symptom description was provided. Comment on visible features only and state limitations."}
"""`;
}

function getResponseText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part: unknown) =>
      typeof part === "string"
        ? part
        : typeof part === "object" && part && "text" in part
          ? String((part as { text?: unknown }).text ?? "")
          : ""
    )
    .join("");
}

async function generateGeminiResponse(prompt: string, image: InlineImage | null) {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini is not configured. Add GEMINI_API_KEY to the server environment.");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: "You provide cautious, non-diagnostic dermatology triage. Return only the requested structured JSON.",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
      responseSchema: createDermatologyResponseSchema(),
    },
  });

  const parts = image
    ? [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }]
    : [{ text: prompt }];
  const result = await model.generateContent(parts);
  return result.response.text();
}

async function generateGroqResponse(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("Groq is not configured. Add GROQ_API_KEY to the server environment.");

  const client = new Groq({ apiKey });
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 1000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You provide cautious, non-diagnostic dermatology triage. Return only the requested JSON." },
      { role: "user", content: prompt },
    ],
  });

  return getResponseText(completion.choices[0]?.message?.content);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    if (AI_PROVIDER !== "gemini" && AI_PROVIDER !== "groq") {
      return NextResponse.json({ ok: false, error: "AI provider is not configured correctly." }, { status: 500 });
    }
    if (AI_PROVIDER === "gemini" && !process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
      return NextResponse.json({ ok: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    }
    if (AI_PROVIDER === "groq" && !process.env.GROQ_API_KEY?.trim()) {
      return NextResponse.json({ ok: false, error: "Groq is not configured. Add GROQ_API_KEY to the server environment." }, { status: 503 });
    }

    const body = await req.json();
    const symptoms = String(body.symptoms || body.symptom || "").trim();
    if (symptoms.length > MAX_SYMPTOM_LENGTH) {
      return NextResponse.json({ ok: false, error: "Please keep the symptom description under 2,000 characters." }, { status: 400 });
    }

    let image: InlineImage | null;
    try {
      image = parseImageDataUrl(body.image);
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid image upload." }, { status: 400 });
    }

    if (!symptoms && !image) {
      return NextResponse.json({ ok: false, error: "Describe your symptoms or upload an image." }, { status: 400 });
    }
    if (AI_PROVIDER === "groq" && image) {
      return NextResponse.json({ ok: false, error: "Image analysis requires Gemini. Set AI_PROVIDER=gemini to analyze images." }, { status: 400 });
    }

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Account not found. Please complete registration first." }, { status: 404 });
    }
    if (userDoc.role !== "patient") {
      return NextResponse.json({ ok: false, error: "Only patients may use dermatology AI consultation." }, { status: 403 });
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) return NextResponse.json({ ok: false, error: "Patient profile not found." }, { status: 404 });

    const knowledgeContext = await getRelevantKnowledgeContext(symptoms || "skin concern in uploaded image", 3);
    const prompt = buildDermatologyPrompt(symptoms, knowledgeContext, Boolean(image));
    const rawText = AI_PROVIDER === "gemini"
      ? await generateGeminiResponse(prompt, image)
      : await generateGroqResponse(prompt);

    if (!rawText) {
      return NextResponse.json({ ok: false, error: "The AI service returned an empty response. Please try again." }, { status: 502 });
    }

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(rawText);
    } catch {
      parsedResponse = extractJsonFromText(rawText);
    }

    if (!isValidDermatologyResponse(parsedResponse)) {
      return NextResponse.json({ ok: false, error: "The AI service returned an invalid report. Please try again." }, { status: 502 });
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

    return NextResponse.json({
      ok: true,
      report: {
        id: report._id.toString(),
        clinicalSummary: parsedResponse.clinicalSummary,
        possibleConditions: parsedResponse.possibleConditions,
        recommendedNextSteps: parsedResponse.recommendedNextSteps,
        followUpGuidance: parsedResponse.followUpGuidance,
        confidenceScore: parsedResponse.confidenceScore,
        needsImmediateProfessionalCare: parsedResponse.needsImmediateProfessionalCare,
        provider: AI_PROVIDER,
        model: AI_PROVIDER === "gemini" ? GEMINI_MODEL : GROQ_MODEL,
        includedImage: Boolean(image),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[AI consultation] Failed to process request:", error);
    const message = error instanceof Error && error.message.startsWith("Gemini is not configured")
      ? error.message
      : error instanceof Error && error.message.startsWith("Groq is not configured")
        ? error.message
        : "Unable to complete the consultation right now. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
