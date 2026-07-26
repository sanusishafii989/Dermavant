import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { isUserRole } from "@/lib/roles";
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
    unsafe_metadata: { role?: string };
  };
};

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

  if (event.type !== "user.created") {
    return NextResponse.json({ received: true });
  }

  const { data } = event;
  const roleFromPublic = data.public_metadata?.role;
  const roleFromUnsafe = data.unsafe_metadata?.role;
  const role = isUserRole(roleFromPublic)
    ? roleFromPublic
    : isUserRole(roleFromUnsafe)
      ? roleFromUnsafe
      : null;

  if (!role) {
    return NextResponse.json(
      { error: "User role missing from metadata" },
      { status: 400 }
    );
  }

  if (!isUserRole(roleFromPublic)) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(data.id, {
      publicMetadata: { role },
    });
  }

  await connectDB();

  const existingUser = await User.findOne({ clerkId: data.id });
  if (existingUser) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const fullName =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || "Aetheris User";
  const email = data.email_addresses[0]?.email_address ?? "";
  const phone = data.phone_numbers[0]?.phone_number ?? "";

  const user = await User.create({
    clerkId: data.id,
    fullName,
    email,
    phone,
    role,
    profilePhoto: data.image_url ?? undefined,
    status: role === "admin" ? "active" : "pending_verification",
  });

  const wallet = await Wallet.create({
    ownerId: user._id,
    ownerRole: role,
    balance: 0,
    currency: "NGN",
  });

  switch (role) {
    case "patient": {
      const patient = new Patient({ user_id: user._id });
      await patient.save();
      break;
    }
    case "doctor": {
      const doctor = new Doctor({ user_id: user._id });
      await doctor.save();
      break;
    }
    case "partner":
      await Partner.create({
        business_name: `${fullName}'s Pharmacy`,
        license: "PENDING",
        owner_name: fullName,
        email,
        phone,
        address: "",
        rating: 0,
        status: "pending",
      });
      break;
    case "admin":
      await Admin.create({
        userId: user._id,
        adminLevel: "standard",
        permissions: [],
      });
      break;
  }

  return NextResponse.json({ received: true });
}
