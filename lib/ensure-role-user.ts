import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Doctor, Partner, User } from "@/models";

export type KycRole = "doctor" | "partner";

/**
 * Repair a missing MongoDB user/profile record from the authenticated Clerk
 * account. The role is read only from trusted public metadata, never request data.
 */
export async function ensureKycRoleUser(expectedRole?: KycRole) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { ok: false as const, status: 401, error: "Sign in is required." };
  }

  const metadataRole = clerkUser.publicMetadata?.role;
  if (metadataRole !== "doctor" && metadataRole !== "partner") {
    return { ok: false as const, status: 403, error: "A doctor or pharmacy account is required." };
  }
  if (expectedRole && metadataRole !== expectedRole) {
    return { ok: false as const, status: 403, error: "This account does not match the requested portal." };
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { ok: false as const, status: 422, error: "Add an email address to your Clerk account before continuing." };
  }
  const fullName = clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    (metadataRole === "doctor" ? "Doctor" : "Pharmacy owner");
  const phone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || "";

  await connectDB();

  let user = await User.findOne({ clerkId: clerkUser.id });
  if (user && user.role !== metadataRole) {
    return { ok: false as const, status: 403, error: "Your account role does not match this portal. Contact an administrator." };
  }

  if (!user) {
    try {
      user = await User.findOneAndUpdate(
        { clerkId: clerkUser.id },
        {
          $setOnInsert: {
            clerkId: clerkUser.id,
            fullName,
            email: email.toLowerCase(),
            phone,
            role: metadataRole,
            profilePhoto: clerkUser.imageUrl || undefined,
            status: "pending_verification",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch {
      // A Clerk webhook may have created the same user concurrently.
      user = await User.findOne({ clerkId: clerkUser.id });
    }
  }

  if (!user || user.role !== metadataRole) {
    return { ok: false as const, status: 500, error: "Could not initialize your application account. Please retry." };
  }

  if (metadataRole === "doctor") {
    await Doctor.updateOne(
      { user_id: user._id as any } as any,
      { $setOnInsert: { license_number: "PENDING", specialization: "General Practice" } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } else {
    await Partner.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $setOnInsert: {
          business_name: `${fullName}'s Pharmacy`,
          license: "PENDING",
          owner_name: fullName,
          email: email.toLowerCase(),
          phone: phone || "Pending",
          address: "",
          rating: 0,
          status: "pending",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  return { ok: true as const, user, role: metadataRole };
}
