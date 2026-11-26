import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import {
  FALLBACK_GEMINI_TRANSCRIBE_MODELS,
  deduplicateModels,
  formatGeminiUserError,
  getGeminiClient,
  getGeminiTranscribeModel,
  isGeminiConfigured,
  runWithGeminiModelFallback,
} from "@/lib/ai/gemini";
import { normalizeAudioMimeType } from "@/lib/ai/voiceUtils";

const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

function parseAudioPayload(rawAudio: unknown, rawMimeType?: unknown): { mimeType: string; data: string } {
  if (typeof rawAudio !== "string" || !rawAudio.trim()) {
    throw new Error("No recorded audio was received.");
  }

  const dataUrlMatch = rawAudio.match(/^data:([^;,\s]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/]+={0,2})$/i);
  const rawMime = dataUrlMatch ? dataUrlMatch[1] : typeof rawMimeType === "string" ? rawMimeType : "audio/webm";
  const data = dataUrlMatch ? dataUrlMatch[2] : rawAudio.trim();

  const normalizedMime = normalizeAudioMimeType(rawMime);
  if (!normalizedMime) {
    throw new Error("Unsupported audio format. Please record using WebM, MP4, MP3, OGG, or WAV.");
  }

  const bytes = Buffer.from(data, "base64");
  if (bytes.byteLength === 0) {
    throw new Error("Recorded audio was empty. Please speak clearly and try again.");
  }
  if (bytes.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("Audio recording must be 6 MB or smaller.");
  }

  return { mimeType: normalizedMime, data };
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

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || !["patient", "doctor", "partner", "admin"].includes(userDoc.role)) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    }

    const body = await req.json();
    let parsedAudio: { mimeType: string; data: string };
    try {
      parsedAudio = parseAudioPayload(body.audio, body.mimeType);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Invalid audio recording." },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const candidateModels = deduplicateModels(
      getGeminiTranscribeModel(),
      FALLBACK_GEMINI_TRANSCRIBE_MODELS
    );

    const { result, model } = await runWithGeminiModelFallback(candidateModels, (modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: parsedAudio.mimeType,
                data: parsedAudio.data,
              },
            },
            {
              text: "Transcribe the spoken words accurately into plain English text without extra labels, timestamps, or commentary. Preserve medical or dermatology terms accurately. If there is only silence or background noise with no speech, return an empty string.",
            },
          ],
        },
      })
    );

    const transcript = (result.text ?? "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();

    return NextResponse.json({
      ok: true,
      transcript,
      model,
    });
  } catch (error) {
    console.error("[AI transcribe] Failed to process speech:", error);
    const formatted = formatGeminiUserError(
      error,
      "Unable to transcribe speech right now. Please type or try again."
    );
    return NextResponse.json({ ok: false, error: formatted.message }, { status: formatted.status });
  }
}
