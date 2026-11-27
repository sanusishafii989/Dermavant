import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, ChatHistory } from "@/models";
import {
  FALLBACK_GEMINI_TEXT_MODELS,
  deduplicateModels,
  formatGeminiUserError,
  getGeminiClient,
  getGeminiModel,
  isGeminiConfigured,
  runWithGeminiModelFallback,
} from "@/lib/ai/gemini";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_REQUEST_MESSAGES = 200;
const MAX_CONTEXT_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 5000;
type ResearchMessage = { role: "user" | "assistant"; content: string };
type ResearchImage = { mimeType: "image/jpeg" | "image/png" | "image/webp"; data: string };

const RESEARCH_SYSTEM_PROMPT = `You are a medical research assistant for licensed healthcare professionals on the Dermavant platform.
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
Do not treat this chat as a patient-specific diagnosis. Always include a brief disclaimer that the information is AI-generated and should be verified against primary sources before clinical decision-making.`;

function parseImage(value: unknown): ResearchImage | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Upload a JPEG, PNG, or WebP image.");
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
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
  candidateModels: string[]
): Promise<{ text: string; model: string }> {
  const ai = getGeminiClient();
  const systemInstruction = image
    ? `${RESEARCH_SYSTEM_PROMPT}\nFor an attached image, describe observable features and limitations first. Do not identify a definitive diagnosis from an image alone.`
    : RESEARCH_SYSTEM_PROMPT;

  const history = messages.slice(0, -1).map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const messagePayload = image
    ? [
        { text: lastMessage.content || "Please analyze observable dermatologic features in this clinical image." },
        { inlineData: { mimeType: image.mimeType, data: image.data } },
      ]
    : lastMessage.content;

  const { result: response, model } = await runWithGeminiModelFallback(candidateModels, (modelName) => {
    const chat = ai.chats.create({
      model: modelName,
      history,
      config: { systemInstruction },
    });
    return chat.sendMessage({ message: messagePayload });
  });

  return { text: response.text ?? "", model };
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

    if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > MAX_REQUEST_MESSAGES) {
      return NextResponse.json({ ok: false, error: "The conversation history is invalid or too large." }, { status: 400 });
    }

    const latestRawMessage = rawMessages[rawMessages.length - 1] as Record<string, unknown> | null;
    if (
      !latestRawMessage ||
      latestRawMessage.role !== "user" ||
      typeof latestRawMessage.content !== "string"
    ) {
      return NextResponse.json({ ok: false, error: "Your latest research message is missing or invalid." }, { status: 400 });
    }
    if (latestRawMessage.content.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ ok: false, error: "Keep each research message under 5,000 characters." }, { status: 400 });
    }

    // Older saved conversations may contain malformed or oversized messages.
    // Keep only valid recent context so one legacy entry cannot block new turns.
    const validHistory = rawMessages.slice(0, -1).flatMap((value: unknown) => {
      if (!value || typeof value !== "object") return [];
      const message = value as Record<string, unknown>;
      if (
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        message.content.length > MAX_MESSAGE_CHARS
      ) return [];
      return [{ role: message.role, content: message.content } as ResearchMessage];
    });
    const messages: ResearchMessage[] = [
      ...validHistory.slice(-(MAX_CONTEXT_MESSAGES - 1)),
      { role: "user", content: latestRawMessage.content },
    ];

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

    const candidateModels = deduplicateModels(getGeminiModel(), FALLBACK_GEMINI_TEXT_MODELS);
    const { text: responseText, model: resolvedModel } = await generateGeminiAnswer(
      messages,
      image,
      candidateModels
    );
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
        model: resolvedModel,
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
      model: resolvedModel,
    });
  } catch (error: any) {
    console.error("[DOCTOR RESEARCH] Error:", error?.message || String(error));
    const formatted = formatGeminiUserError(
      error,
      "The research service could not process your request."
    );
    return NextResponse.json(
      {
        ok: false,
        error: formatted.message,
        retryable: formatted.status === 429 || formatted.status >= 500,
      },
      { status: formatted.status >= 500 ? 502 : formatted.status }
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
