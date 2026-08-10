import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { connectDB } from "@/lib/db";
import { AIReport, Patient, User } from "@/models";
import { extractJsonFromText, isValidDermatologyResponse } from "@/lib/ai/guardrails";
import { getRelevantKnowledgeContext } from "@/lib/ai/rag";

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

const GROQ_API_KEY = getEnvValue("GROQ_API_KEY");
const GROQ_MODEL = getEnvValue("GROQ_MODEL") || "llama-3.3-70b-versatile";

function buildDermatologyPrompt(symptoms: string, clinicalContext: string) {
  return `You are a dermatological symptom triage assistant for a patient-facing health app, focused specifically on skin, hair, and nail conditions.
- You are not a licensed professional.
- Do not diagnose with false certainty.
- Do not claim to replace a licensed medical professional.
- Do not prescribe controlled or restricted medications.
- Do not suppress uncertainty.
- If symptoms are unclear, serious, or suggest infection, explicitly advise the patient to seek a healthcare professional or emergency care.
- Treat the input as a text description of visible dermatological symptoms (rash location, appearance, duration, itching, pain, scaling, color changes, nail changes, hair loss, etc.).
- Use dermatology-relevant conditions like eczema, contact dermatitis, psoriasis, fungal infection, acne, rosacea, seborrheic dermatitis, folliculitis, lichen planus, xerosis, urticaria, pityriasis rosea, or other common skin conditions.
- If the description is too vague or lacks symptom details (e.g. greetings like "hello"), state that the input lacks symptom details, set confidence low, and recommend providing specific symptoms.

${clinicalContext ? `RELEVANT CLINICAL KNOWLEDGE BASE GUIDELINES:\n"""\n${clinicalContext}\n"""\n` : ""}

You MUST respond ONLY with a JSON object matching this exact schema:
{
  "clinicalSummary": "Short summary of symptoms and triage assessment",
  "possibleConditions": [
    {
      "condition": "Condition name or 'Insufficient Information'",
      "confidence": 0.1,
      "reasoning": "Reasoning for condition or explanation of insufficient data"
    }
  ],
  "recommendedNextSteps": "Recommended next steps for the user",
  "followUpGuidance": "Follow-up guidance for monitoring",
  "confidenceScore": 0.1,
  "needsImmediateProfessionalCare": false
}

CRITICAL SCHEMA RULES:
1. All string fields ("clinicalSummary", "recommendedNextSteps", "followUpGuidance") MUST be non-empty strings.
2. "confidenceScore" MUST be a number between 0.0 and 1.0.
3. "needsImmediateProfessionalCare" MUST be a boolean (true or false).
4. "possibleConditions" MUST be a non-empty array with at least 1 item.

Input symptoms:
"""
${symptoms}
"""
`;
}

export async function POST(req: Request) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Groq API key is not configured" },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const symptoms = String(body.symptoms || body.symptom || "").trim();
    const image = body.image as string | undefined;

    if (!symptoms && !image) {
      return NextResponse.json(
        { ok: false, error: "Symptoms text or an image is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const fullName =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Aetheris Patient";
        const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@example.com`;
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber || "";

        const createdUser = await User.create({
          clerkId: userId,
          fullName,
          email,
          phone,
          role: "patient",
          status: "pending_verification",
        } as any);
        userDoc = createdUser.toObject();
      } catch (autoProvisionErr) {
        console.error("[AI CHAT] Failed to auto-provision user document:", autoProvisionErr);
      }
    }

    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Patient account not found in database" }, { status: 404 });
    }

    if (userDoc.role !== "patient") {
      return NextResponse.json({ ok: false, error: "Only patients may use dermatology AI consultation" }, { status: 403 });
    }

    let patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      try {
        const createdPatient = await Patient.create({
          user_id: userDoc._id,
        } as any);
        patientDoc = createdPatient.toObject();
      } catch (autoProvisionErr) {
        console.error("[AI CHAT] Failed to auto-provision patient document:", autoProvisionErr);
      }
    }

    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const knowledgeContext = await getRelevantKnowledgeContext(symptoms || "skin condition from image", 3);
    const prompt = buildDermatologyPrompt(symptoms || "Please analyze the visible skin condition in the uploaded image.", knowledgeContext);
    const client = new Groq({ apiKey: GROQ_API_KEY });

    // Use text-only model (llama-4-scout not available on this Groq account)
    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a dermatological symptom triage assistant. Return only a JSON object with the requested structure.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = (completion.choices[0]?.message as { content?: unknown } | undefined)?.content;
    const rawText =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((part: unknown) => (typeof part === "string" ? part : typeof part === "object" && part && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
              .join("")
          : "";

    if (!rawText) {
      return NextResponse.json(
        { ok: false, error: "Groq returned an empty response" },
        { status: 502 }
      );
    }

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(rawText);
    } catch {
      parsedResponse = extractJsonFromText(rawText);
    }

    if (!isValidDermatologyResponse(parsedResponse)) {
      return NextResponse.json(
        { ok: false, error: "Groq response did not match the expected dermatology schema" },
        { status: 502 }
      );
    }

    const report = await AIReport.create({
      patient_id: patientDoc._id as any,
      symptoms_text: symptoms,
      diagnosis: parsedResponse.possibleConditions.map((condition: any) => ({
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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process dermatology consultation",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
