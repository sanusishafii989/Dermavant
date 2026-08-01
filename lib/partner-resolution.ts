export type PartnerLookupUser = {
  email?: string | null;
  fullName?: string | null;
};

export type PartnerLookupModel = {
  findOne: (query: any) => Promise<any>;
};

function normalizePartnerLookup(value?: string | null) {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildPartnerLookupQuery(userDoc: PartnerLookupUser) {
  const emailLookup = normalizePartnerLookup(userDoc.email);
  const nameLookup = normalizePartnerLookup(userDoc.fullName);
  const searchTerms: any[] = [];

  if (emailLookup) {
    searchTerms.push({ email: userDoc.email });
    searchTerms.push({ email: { $regex: new RegExp(`^${escapeRegExp(emailLookup)}$`, "i") } });
  }

  if (nameLookup) {
    searchTerms.push({ owner_name: userDoc.fullName });
    searchTerms.push({ owner_name: { $regex: new RegExp(`^${escapeRegExp(nameLookup)}$`, "i") } });
    searchTerms.push({ owner_name: { $regex: new RegExp(escapeRegExp(nameLookup), "i") } });
    searchTerms.push({ business_name: userDoc.fullName });
    searchTerms.push({ business_name: { $regex: new RegExp(`^${escapeRegExp(nameLookup)}$`, "i") } });
    searchTerms.push({ business_name: { $regex: new RegExp(escapeRegExp(nameLookup), "i") } });
  }

  return searchTerms.length > 0 ? { $or: searchTerms } : null;
}

export async function resolvePartnerForUser(
  userDoc: PartnerLookupUser,
  partnerModel: PartnerLookupModel,
  partnerId?: string | null
) {
  const partnerQuery = buildPartnerLookupQuery(userDoc);

  if (partnerQuery) {
    const partnerDoc = await partnerModel.findOne(partnerQuery);
    if (partnerDoc) {
      return partnerDoc;
    }
  }

  if (partnerId) {
    return partnerModel.findOne({ _id: partnerId });
  }

  return null;
}
