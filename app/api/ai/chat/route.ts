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

  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) throw new Error("Upload a JPEG, PNG, or WebP image.");

  const encoded = match[2];
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 3 MB or smaller.");
  }

  return { mimeType: match[1].toLowerCase() as InlineImage["mimeType"], data: encoded };
}

function buildDermatologyPrompt(symptoms: string, clinicalContext: string, hasImage: boolean): string {
  return `You are a cautious dermatology triage assistant for Dermavant.
Provide preliminary educational triage only — never a definitive medical diagnosis and never prescribe medication.

Rules:
- ${hasImage ? "Describe observable skin features in the uploaded image first, and note photo limitations such as lighting, focus, or skin-tone contrast." : "Work strictly from the symptom description and ask clarifying questions when helpful."}
- State uncertainty plainly. If the available information is limited, return "Insufficient information" as the possible condition and ask for useful details.
- If symptoms or visible signs could indicate a serious problem, rapidly spreading infection, severe allergic reaction, blistering mucosal disease, or other emergency, set needsImmediateProfessionalCare to true and advise urgent professional care.
- Never present model confidence as a medically validated probability.
- Relevant symptoms may include location, appearance, duration, itching, pain, scaling, color changes, nail changes, and hair loss.

${clinicalContext ? `Relevant general dermatology reference guidance:
"""
${clinicalContext}
"""
` : ""}
Return only a JSON object matching the required schema.

Input symptoms:
"""
${symptoms || "No symptom description was provided. Comment on visible features only and state limitations."}
"""`;
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
