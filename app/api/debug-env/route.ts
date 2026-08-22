import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Doctor } from "@/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};

  // Step 1: currentUser()
  try {
    const user = await currentUser();
    result.currentUser = user
      ? { id: user.id, role: (user as any)?.publicMetadata?.role }
      : "null (not authenticated)";
  } catch (err) {
    result.currentUserError = String(err);
  }

  // Step 2: connectDB()
  try {
    await connectDB();
    result.db = "connected";
  } catch (err) {
    result.dbError = String(err);
  }

  // Step 3: User query
  try {
    const user = await currentUser();
    if (user) {
      const userDoc = await User.findOne({ clerkId: user.id }).lean();
      result.userDoc = userDoc
        ? { _id: String(userDoc._id), role: userDoc.role, fullName: userDoc.fullName }
        : "not found in DB";
    }
  } catch (err) {
    result.queryError = String(err);
  }

  // Step 4: Doctor query
  try {
    const user = await currentUser();
    if (user) {
      const userDoc = await User.findOne({ clerkId: user.id }).lean();
      if (userDoc) {
        const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
        result.doctor = doctor
          ? { _id: String(doctor._id), status: doctor.status }
          : "not found";
      }
    }
  } catch (err) {
    result.doctorError = String(err);
  }

  return NextResponse.json(result, { status: 200 });
}
