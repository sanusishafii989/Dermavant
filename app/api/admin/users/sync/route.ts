import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isUserRole, type UserRole } from "@/lib/roles";
import { Admin, Doctor, Partner, Patient, User, Wallet } from "@/models";

export const dynamic = "force-dynamic";

async function ensureRoleProfile(
  role: UserRole,
  userId: import("mongoose").Types.ObjectId,
  fullName: string,
  email: string,
  phone: string
) {
  switch (role) {
    case "patient": {
      const existing = await Patient.findOne({ user_id: userId } as any).lean();
      if (!existing) await Patient.create({ user_id: userId } as any);
      break;
    }
    case "doctor": {
      const existing = await Doctor.findOne({ user_id: userId } as any).lean();
      if (!existing) await Doctor.create({ user_id: userId } as any);
      break;
    }
    case "partner": {
      const existing = await Partner.findOne({ email: email.toLowerCase() }).lean();
      if (!existing) {
        await Partner.create({
          business_name: `${fullName}'s Pharmacy`,
          license: "PENDING",
          owner_name: fullName,
          email,
          phone,
          address: "",
          rating: 0,
          status: "pending",
        } as any);
      }
      break;
    }
    case "admin": {
      const existing = await Admin.findOne({ userId } as any).lean();
      if (!existing) {
        await Admin.create({
          userId,
          adminLevel: "standard",
          permissions: [],
        } as any);
      }
      break;
    }
  }

  const walletExists = await Wallet.findOne({ ownerId: userId } as any).lean();
  if (!walletExists) {
    await Wallet.create({
      ownerId: userId,
      ownerRole: role,
      balance: 0,
      currency: "NGN",
    } as any);
  }
}

export async function POST() {
  try {
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
    const skipped = 0;

    for (const clerkUser of clerkUsers.data) {
      const clerkId = clerkUser.id;
      const fullName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Unknown User";
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@example.com`;
      const phone = clerkUser.phoneNumbers[0]?.phoneNumber || "";
      const profilePhoto = clerkUser.imageUrl;
      const roleFromMeta = (clerkUser as any).publicMetadata?.role;
      const role: UserRole = isUserRole(roleFromMeta) ? roleFromMeta : "patient";

      let userDoc = await User.findOne({ clerkId });

      if (!userDoc) {
        userDoc = await User.create({
          clerkId,
          fullName,
          email,
          phone,
          role,
          profilePhoto,
          status: role === "admin" ? "active" : "pending_verification",
        } as any);
        created++;
      } else {
        const oldRole = userDoc.role;
        userDoc.fullName = fullName;
        userDoc.email = email;
        userDoc.phone = phone;
        userDoc.role = role;
        if (profilePhoto) userDoc.profilePhoto = profilePhoto;
        if (role === "admin" && userDoc.status !== "active") {
          userDoc.status = "active";
        }
        await userDoc.save();

        if (oldRole !== role) {
          await ensureRoleProfile(role, userDoc._id, fullName, email, phone);
        }
        updated++;
      }

      // Ensure role-specific profile + wallet exist
      await ensureRoleProfile(role, userDoc._id, fullName, email, phone);
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
