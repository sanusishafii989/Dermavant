import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, ChatHistory } from "@/models";

const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

type ResearchMessage = { role: "user" | "assistant"; content: string };
type ResearchImage = { mimeType: "image/jpeg" | "image/png" | "image/webp"; data: string };

const RESEARCH_SYSTEM_PROMPT = `You are a medical research assistant for licensed healthcare professionals on the Aetheris Health platform.

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
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("Image must be 3 MB or smaller.");
  return { mimeType: match[1].toLowerCase() as ResearchImage["mimeType"], data: match[2] };
}

async function generateGeminiAnswer(messages: ResearchMessage[], image: ResearchImage | null) {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini is not configured.");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: image
      ? `${RESEARCH_SYSTEM_PROMPT}\nFor an attached image, describe observable features and limitations first. Do not identify a definitive diagnosis from an image alone.`
      : RESEARCH_SYSTEM_PROMPT,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
  });
  const history = messages.slice(0, -1).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  const parts = image
    ? [{ text: lastMessage.content }, { inlineData: { mimeType: image.mimeType, data: image.data } }]
    : [{ text: lastMessage.content }];
  const result = await chat.sendMessage(parts);
  return result.response.text();
}

async function generateGroqAnswer(messages: ResearchMessage[]) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("Groq is not configured.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: "system", content: RESEARCH_SYSTEM_PROMPT },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error("The research service could not process your request.");
  return String(data?.choices?.[0]?.message?.content || "");
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    if (AI_PROVIDER !== "gemini" && AI_PROVIDER !== "groq") {
      return NextResponse.json({ ok: false, error: "AI provider is not configured correctly." }, { status: 500 });
    }

    const body = await req.json();
    const rawMessages = body.messages;
    const conversationId = body.conversationId;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 40) {
      return NextResponse.json({ ok: false, error: "Provide between 1 and 40 chat messages." }, { status: 400 });
    }
    const messages = rawMessages as ResearchMessage[];
    if (messages.some((message) =>
      !message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || message.content.length > 5000
    ) || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "The research message format is invalid." }, { status: 400 });
    }

    let image: ResearchImage | null;
    try {
      image = parseImage(body.image);
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid image upload." }, { status: 400 });
    }
    if (AI_PROVIDER === "groq" && image) {
      return NextResponse.json({ ok: false, error: "Image review requires Gemini. Set AI_PROVIDER=gemini to analyze images." }, { status: 400 });
    }
    if (AI_PROVIDER === "gemini" && !process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
      return NextResponse.json({ ok: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment.", retryable: false }, { status: 503 });
    }
    if (AI_PROVIDER === "groq" && !process.env.GROQ_API_KEY?.trim()) {
      return NextResponse.json({ ok: false, error: "Groq is not configured. Add GROQ_API_KEY to the server environment.", retryable: false }, { status: 503 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json(
        { ok: false, error: "Only doctors can use the research assistant" },
        { status: 403 }
      );
    }

    const responseText = AI_PROVIDER === "gemini"
      ? await generateGeminiAnswer(messages, image)
      : await generateGroqAnswer(messages);

    if (!responseText) {
      return NextResponse.json({ ok: false, error: "The research service returned an empty response.", retryable: true }, { status: 502 });
    }

    // Save chat history
    const lastUserMsg = messages[messages.length - 1];
    const title = lastUserMsg?.content?.slice(0, 50) || "Research conversation";
    const provider = AI_PROVIDER;
    const model = AI_PROVIDER === "gemini" ? GEMINI_MODEL : GROQ_MODEL;

    if (conversationId) {
      // Append to existing conversation
      await ChatHistory.updateOne(
        { _id: conversationId, user_id: userDoc._id } as any,
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
    } else {
      // Create new conversation
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
        provider,
        model,
      });
    }

    return NextResponse.json({ ok: true, response: responseText, conversationId, provider, model });
  } catch (error: any) {
    console.error("[DOCTOR RESEARCH] Error:", error?.message || String(error));
    return NextResponse.json(
      { ok: false, error: "The research service could not process your request.", retryable: true },
      { status: 502 }
    );
  }
}

// GET — load chat history
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
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
