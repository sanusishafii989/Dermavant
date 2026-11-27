import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Admin, User, Wallet } from "@/models";

/**
 * Ensure a Clerk-authenticated administrator also has the MongoDB records
 * required by admin APIs. Authorization comes only from trusted Clerk
 * publicMetadata, never from request data.
 */
export async function ensureAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { ok: false as const, status: 401, error: "Sign in is required." };
  }
  if (clerkUser.publicMetadata?.role !== "admin") {
    return { ok: false as const, status: 403, error: "Admin access is required." };
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { ok: false as const, status: 422, error: "Add an email address to your account before continuing." };
  }
  const fullName = clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "Dermavant Admin";
  const phone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || "";

  await connectDB();

  const user = await User.findOneAndUpdate(
    { clerkId: clerkUser.id },
    {
      $set: {
        fullName,
        email: email.toLowerCase(),
        phone,
        role: "admin",
        profilePhoto: clerkUser.imageUrl || undefined,
        status: "active",
      },
      $setOnInsert: { clerkId: clerkUser.id },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).catch((error: unknown) => {
    if ((error as { code?: number })?.code === 11000) return null;
    throw error;
  });

  if (!user) {
    return {
      ok: false as const,
      status: 409,
      error: "This email is already linked to another app account. Ask an administrator to reconcile the account record.",
    };
  }

  await Admin.updateOne(
    { userId: user._id as any },
    { $setOnInsert: { adminLevel: "standard", permissions: [] } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  await Wallet.updateOne(
    { ownerId: user._id as any },
    { $setOnInsert: { ownerRole: "admin", balance: 0, currency: "NGN" } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return { ok: true as const, user };
}
