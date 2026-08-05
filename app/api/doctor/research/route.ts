import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

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
Always include a brief disclaimer that the information is AI-generated and should be verified against primary sources before clinical decision-making.`;

export async function POST(req: Request) {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
    const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

    console.log("[DOCTOR RESEARCH] Key prefix:", GROQ_API_KEY?.substring(0, 12) + "...", "Model:", GROQ_MODEL);

    if (!GROQ_API_KEY) {
      console.error("[DOCTOR RESEARCH] GROQ_API_KEY not found in process.env");
      return NextResponse.json(
        { ok: false, error: "Groq API key is not configured. Check .env.local for GROQ_API_KEY." },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "messages array is required" },
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

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: RESEARCH_SYSTEM_PROMPT,
          },
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      }),
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("[DOCTOR RESEARCH] Groq API error:", groqData);
      return NextResponse.json(
        { ok: false, error: groqData?.error?.message || "Groq API error", details: groqData },
        { status: 502 }
      );
    }

    const responseText = groqData?.choices?.[0]?.message?.content || "";

    if (!responseText) {
      return NextResponse.json(
        { ok: false, error: "Groq returned an empty response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, response: responseText });
  } catch (error: any) {
    console.error("[DOCTOR RESEARCH] Error:", error?.message || String(error));
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to process research query",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
