import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isUserRole } from "@/lib/roles";
import { Admin, Doctor, Partner, Patient, User, Wallet } from "@/models";

// Manually sync all Clerk users to MongoDB
export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Dev endpoints are disabled in production" }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const adminDoc = await User.findOne({ clerkId: userId }).lean();
    if (!adminDoc || adminDoc.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 100 });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const clerkUser of clerkUsers.data) {
      const clerkId = clerkUser.id;
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Unknown User";
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@example.com`;
      const phone = clerkUser.phoneNumbers[0]?.phoneNumber || "";
      const profilePhoto = clerkUser.imageUrl;
      const role = (clerkUser as any).publicMetadata?.role;

      if (!isUserRole(role)) {
        skipped++;
        continue;
      }

      let userDoc = await User.findOne({ clerkId });
      if (!userDoc) {
        userDoc = await User.create({
          clerkId,
          fullName,
          email,
          phone,
          role,
          profilePhoto,
          status: "active",
        } as any);
        created++;
      } else {
        await User.updateOne(
          { clerkId },
          { $set: { fullName, email, phone, role, profilePhoto, status: "active" } }
        );
        updated++;
      }

      // Create role-specific profile if missing
      if (role === "patient" && !(await Patient.findOne({ user_id: userDoc._id as any }).lean())) {
        await Patient.create({ user_id: userDoc._id } as any);
      } else if (role === "doctor" && !(await Doctor.findOne({ user_id: userDoc._id as any }).lean())) {
        await Doctor.create({ user_id: userDoc._id } as any);
      } else if (role === "partner" && !(await Partner.findOne({ email }).lean())) {
        await Partner.create({ email, business_name: fullName, owner_name: fullName, phone } as any);
      } else if (role === "admin" && !(await Admin.findOne({ userId: userDoc._id as any }).lean())) {
        await Admin.create({ userId: userDoc._id, adminLevel: "standard" } as any);
      }

      // Create wallet if missing
      if (!(await Wallet.findOne({ ownerId: userDoc._id as any }).lean())) {
        await Wallet.create({ ownerId: userDoc._id, ownerRole: role, balance: 0, currency: "NGN" } as any);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Synced ${clerkUsers.data.length} Clerk users`,
      created,
      updated,
      skipped,
      total: clerkUsers.data.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to sync users", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
