import { Partner, User } from "@/models";
import { resolvePartnerForUser } from "@/lib/partner-resolution";

/**
 * Finds or creates a Partner profile for a partner User.
 * Tries email lookup, then resolvePartnerForUser (business_name/owner_name),
 * then auto-creates a new Partner profile if none exists.
 */
export async function ensurePartnerProfile(userDoc: {
  _id: import("mongoose").Types.ObjectId;
  email: string;
  fullName: string;
  phone?: string;
}): Promise<any> {
  // 1. Try email match
  let partner = await Partner.findOne({ email: userDoc.email }).lean();

  // 2. Try resolvePartnerForUser (business_name, owner_name)
  if (!partner) {
    partner = await resolvePartnerForUser(
      { email: userDoc.email, fullName: userDoc.fullName },
      { findOne: (query: any) => Partner.findOne(query).lean() }
    );
  }

  // 3. Auto-create Partner profile if still not found
  if (!partner) {
    const created = await Partner.create({
      business_name: userDoc.fullName,
      license: "PENDING",
      owner_name: userDoc.fullName,
      email: userDoc.email,
      phone: userDoc.phone || "N/A",
      address: "",
      rating: 0,
      status: "pending",
    } as any);
    partner = created.toObject();
  }

  return partner;
}
