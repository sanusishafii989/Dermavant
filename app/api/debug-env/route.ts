import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vars = [
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "MONGODB_URI",
    "GROQ_API_KEY",
    "PAYSTACK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];

  const status: Record<string, string> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (!val) {
      status[v] = "MISSING";
    } else {
      status[v] = `${val.substring(0, 8)}... (length: ${val.length})`;
    }
  }

  return NextResponse.json(status, { status: 200 });
}
