import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { isUserRole, type UserRole } from "@/lib/roles";
import {
  Admin,
  Doctor,
  Partner,
  Patient,
  User,
  Wallet,
} from "@/models";

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    phone_numbers: Array<{ phone_number: string }>;
    image_url: string | null;
    public_metadata: { role?: string };
    unsafe_metadata?: { role?: string };
    deleted?: boolean;
  };
};

async function ensureRoleProfile(
  role: UserRole,
  userId: mongoose.Types.ObjectId,
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

  // Keep the existing balance while synchronizing ownership after a role repair.
  await Wallet.updateOne(
    { ownerId: userId } as any,
    {
      $set: { ownerRole: role },
      $setOnInsert: { balance: 0, currency: "NGN" },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { data, type } = event;

  // Handle user deletion — mark as suspended in DB
  if (type === "user.deleted" || data.deleted) {
    await connectDB();
    await User.updateOne(
      { clerkId: data.id },
      { $set: { status: "suspended" } }
    ).exec();
    return NextResponse.json({ received: true });
  }

  // For both user.created and user.updated, sync the user
  if (type !== "user.created" && type !== "user.updated") {
    return NextResponse.json({ received: true });
  }

  const roleFromPublic = data.public_metadata?.role;
  const requestedRole = data.unsafe_metadata?.role;
  const selfSignupRole = requestedRole === "patient" || requestedRole === "doctor" || requestedRole === "partner"
    ? requestedRole
    : undefined;
  const role: UserRole | undefined = isUserRole(roleFromPublic)
    ? roleFromPublic === "patient" && selfSignupRole && selfSignupRole !== "patient"
      ? selfSignupRole
      : roleFromPublic
    : selfSignupRole;

  // Do not invent a patient role for users whose signup role has not arrived yet.
  // The redirect route will promote a valid selected role after authentication.
  if (!role) {
    return NextResponse.json({ received: true, deferred: true });
  }

  await connectDB();

  const fullName =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || "Dermavant User";
  const email = data.email_addresses[0]?.email_address ?? "";
  const phone = data.phone_numbers[0]?.phone_number ?? "";
  const profilePhoto = data.image_url ?? undefined;

  const existingUser = await User.findOne({ clerkId: data.id });

  if (existingUser) {
    // Update existing user with latest Clerk data
    existingUser.fullName = fullName;
    existingUser.email = email;
    existingUser.phone = phone;
    existingUser.role = role;
    if (profilePhoto) existingUser.profilePhoto = profilePhoto;
    if (role === "admin" && existingUser.status !== "active") {
      existingUser.status = "active";
    }
    await existingUser.save();

    // Create the selected role's profile and preserve the wallet balance.
    await ensureRoleProfile(role, existingUser._id, fullName, email, phone);

    return NextResponse.json({ received: true, updated: true });
  }

  // Create new user
  const user = await User.create({
    clerkId: data.id,
    fullName,
    email,
    phone,
    role,
    profilePhoto,
    status: role === "admin" ? "active" : "pending_verification",
  });

  await ensureRoleProfile(role, user._id, fullName, email, phone);

  return NextResponse.json({ received: true, created: true });
}
