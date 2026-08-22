import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Doctor } from "@/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};

  // Step 1: Check env vars
  const vars = ["CLERK_SECRET_KEY", "MONGODB_URI", "GROQ_API_KEY"];
  result.env = {};
  for (const v of vars) {
    result.env[v] = process.env[v] ? "present" : "MISSING";
  }

  // Step 2: Try currentUser()
  try {
    const user = await currentUser();
    result.currentUser = user
      ? { id: user.id, role: (user as any)?.publicMetadata?.role }
      : "null (not authenticated)";
  } catch (err) {
    result.currentUserError = String(err);
  }

  // Step 3: Try connectDB()
  try {
    await connectDB();
    result.db = "connected";
  } catch (err) {
    result.dbError = String(err);
  }

  // Step 4: Try a simple query
  try {
    const count = await User.countDocuments();
    result.userCount = count;
  } catch (err) {
    result.queryError = String(err);
  }

  return NextResponse.json(result, { status: 200 });
}
