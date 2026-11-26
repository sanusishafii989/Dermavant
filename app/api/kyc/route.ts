import { auth } from "@clerk/nextjs/server";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ensureKycRoleUser } from "@/lib/ensure-role-user";
import { KYCApplication, Doctor, Partner } from "@/models";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
type DocumentKind = "license" | "business" | "identity";

function expectedDocumentPath(clerkId: string, kind: DocumentKind) {
  return `kyc/${clerkId}/${kind}/current`;
}

async function isValidPrivateDocument(pathname: unknown, clerkId: string, kind: DocumentKind) {
  if (typeof pathname !== "string" || pathname !== expectedDocumentPath(clerkId, kind)) return false;
  try {
    const metadata = await head(pathname);
    return metadata.size > 0 && metadata.size <= MAX_DOCUMENT_BYTES && ALLOWED_CONTENT_TYPES.has(metadata.contentType);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const account = await ensureKycRoleUser();
    if (!account.ok) return NextResponse.json({ ok: false, error: account.error }, { status: account.status });
    if (account.user.clerkId !== userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const userDoc = account.user;

    const application = await KYCApplication.findOne({ user_id: userDoc._id as any }).lean();
    return NextResponse.json({
      ok: true,
      application: application ? {
        _id: application._id.toString(),
        role: application.role,
        status: application.status,
        review_notes: application.review_notes,
        license_number: application.license_number,
        specialization: application.specialization,
        hospital: application.hospital,
        years_of_experience: application.years_of_experience,
        medical_school: application.medical_school,
        business_name: application.business_name,
        business_registration_number: application.business_registration_number,
        pharmacist_license: application.pharmacist_license,
        phone_number: application.phone_number,
        address: application.address,
        id_document_url: application.id_document_url,
        license_document_url: application.license_document_url,
        business_document_url: application.business_document_url,
      } : null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load KYC" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json() as Record<string, unknown>;
    const role = body.role;
    if (role !== "doctor" && role !== "partner") {
      return NextResponse.json({ ok: false, error: "Invalid role for KYC" }, { status: 400 });
    }

    const account = await ensureKycRoleUser(role);
    if (!account.ok) return NextResponse.json({ ok: false, error: account.error }, { status: account.status });
    if (account.user.clerkId !== userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const userDoc = account.user;

    const textField = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
    const licenseDocument = body.license_document_url;
    const businessDocument = body.business_document_url;
    const identityDocument = body.id_document_url;

    const requiredFields = role === "doctor"
      ? ["license_number", "specialization", "hospital", "phone_number", "address"]
      : ["business_name", "business_registration_number", "pharmacist_license", "phone_number", "address"];
    if (requiredFields.some((key) => !textField(key))) {
      return NextResponse.json({ ok: false, error: "Complete all required credential fields" }, { status: 400 });
    }

    const yearsOfExperience = Number(body.years_of_experience);
    if (role === "doctor" && (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 80)) {
      return NextResponse.json({ ok: false, error: "Enter a valid years-of-experience value" }, { status: 400 });
    }

    const validLicense = await isValidPrivateDocument(licenseDocument, userId, "license");
    const validBusiness = role === "partner"
      ? await isValidPrivateDocument(businessDocument, userId, "business")
      : true;
    const validIdentity = identityDocument
      ? await isValidPrivateDocument(identityDocument, userId, "identity")
      : true;
    if (!validLicense || !validBusiness || !validIdentity) {
      return NextResponse.json({ ok: false, error: "Upload valid private credential files before submitting" }, { status: 400 });
    }

    const existing = await KYCApplication.findOne({ user_id: userDoc._id as any });
    if (existing?.status === "approved") {
      return NextResponse.json({ ok: false, error: "This application has already been approved" }, { status: 400 });
    }

    const kycData = {
      user_id: userDoc._id,
      role,
      ...(role === "doctor" ? {
        license_number: textField("license_number").slice(0, 100),
        specialization: textField("specialization").slice(0, 100),
        hospital: textField("hospital").slice(0, 160),
        years_of_experience: yearsOfExperience,
        medical_school: textField("medical_school").slice(0, 160),
      } : {
        business_name: textField("business_name").slice(0, 160),
        business_registration_number: textField("business_registration_number").slice(0, 100),
        pharmacist_license: textField("pharmacist_license").slice(0, 100),
      }),
      phone_number: textField("phone_number").slice(0, 60),
      address: textField("address").slice(0, 300),
      license_document_url: licenseDocument as string,
      business_document_url: role === "partner" ? businessDocument as string : "",
      id_document_url: typeof identityDocument === "string" ? identityDocument : "",
      status: "pending",
      submitted_at: new Date(),
      reviewed_by: null,
      reviewed_at: null,
      review_notes: "",
    };

    if (existing) {
      await KYCApplication.updateOne({ _id: existing._id as any }, { $set: kycData });
    } else {
      await KYCApplication.create(kycData as any);
    }

    if (role === "doctor") {
      await Doctor.updateOne(
        { user_id: userDoc._id as any },
        { $set: {
          license_number: textField("license_number").slice(0, 100),
          specialization: textField("specialization").slice(0, 100),
          hospital: textField("hospital").slice(0, 160),
          experience: yearsOfExperience,
          status: "pending",
        } },
      );
    } else {
      await Partner.updateOne(
        { email: userDoc.email.toLowerCase() },
        { $set: {
          business_name: textField("business_name").slice(0, 160),
          license: textField("pharmacist_license").slice(0, 100),
          phone: textField("phone_number").slice(0, 60),
          address: textField("address").slice(0, 300),
          status: "pending",
        } },
      );
    }

    return NextResponse.json({ ok: true, message: "KYC application submitted for review" });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to submit KYC" }, { status: 500 });
  }
}
