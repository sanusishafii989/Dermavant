import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { connectDB } from "@/lib/db";
import { AIReport, Patient, User } from "@/models";
import { extractJsonFromText, isValidDermatologyResponse } from "@/lib/ai/guardrails";

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

function buildDermatologyPrompt(symptoms: string) {
  return `You are a dermatological symptom triage assistant for a patient-facing health app, focused specifically on skin, hair, and nail conditions.
- You are not a licensed professional.
- Do not diagnose with false certainty.
- Do not claim to replace a licensed medical professional.
- Do not prescribe controlled or restricted medications.
- Do not suppress uncertainty.
- If symptoms are unclear, serious, or suggest infection, explicitly advise the patient to seek a healthcare professional or emergency care.
- Treat the input as a text description of visible dermatological symptoms (rash location, appearance, duration, itching, pain, scaling, color changes, nail changes, hair loss, etc.).
- Use dermatology-relevant conditions like eczema, contact dermatitis, psoriasis, fungal infection, acne, rosacea, seborrheic dermatitis, folliculitis, lichen planus, xerosis, urticaria, pityriasis rosea, or other common skin conditions.
- If the description is too vague for a confident assessment, say so and recommend professional evaluation.
- Return only a valid JSON object matching the requested schema. No prose, no markdown, and no code fences.

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
    if (!symptoms) {
      return NextResponse.json(
        { ok: false, error: "Symptoms text is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Patient account not found" }, { status: 404 });
    }

    if (userDoc.role !== "patient") {
      return NextResponse.json({ ok: false, error: "Only patients may use dermatology AI consultation" }, { status: 403 });
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const prompt = buildDermatologyPrompt(symptoms);
    const client = new Groq({ apiKey: GROQ_API_KEY });

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
