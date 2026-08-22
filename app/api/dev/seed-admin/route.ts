import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Admin, Wallet } from "@/models";

/**
 * Protected dev-only endpoint to seed a default admin record linked to an
 * existing Clerk user. Requires the following env vars to be set:
 * - DEV_SEED_ADMIN=true
 * - ADMIN_CLERK_ID (Clerk user id for admin)
 * - ADMIN_EMAIL
 * - ADMIN_FULLNAME
 * - ADMIN_SEED_SECRET (must be supplied in header X-SEED-SECRET)
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev endpoints are disabled in production" }, { status: 403 });
  }

  if (process.env.DEV_SEED_ADMIN !== "true") {
    return NextResponse.json({ error: "DEV_SEED_ADMIN is not enabled" }, { status: 403 });
  }

  const seedSecret = req.headers.get("x-seed-secret") || "";
  if (!process.env.ADMIN_SEED_SECRET || seedSecret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: "Invalid or missing seed secret" }, { status: 401 });
  }

  const clerkId = process.env.ADMIN_CLERK_ID;
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const fullName = process.env.ADMIN_FULLNAME || "Admin";

  if (!clerkId) {
    return NextResponse.json({ error: "ADMIN_CLERK_ID is not configured" }, { status: 400 });
  }

  await connectDB();

  // If a user already exists with this clerkId, return it
  let user = await User.findOne({ clerkId });
  if (!user) {
    user = await User.create({
      clerkId,
      fullName,
      email,
      role: "admin",
      status: "active",
    });
  }

  // Ensure wallet exists
  let wallet = await Wallet.findOne({ ownerId: user._id });
  if (!wallet) {
    wallet = await Wallet.create({ ownerId: user._id, ownerRole: "admin", balance: 0, currency: "NGN" });
  }

  // Ensure admin document exists
  let admin = await Admin.findOne({ userId: user._id });
  if (!admin) {
    admin = await Admin.create({ userId: user._id, adminLevel: "super", permissions: [] });
  }

  return NextResponse.json({ ok: true, userId: user._id, adminId: admin._id, walletId: wallet._id });
}
