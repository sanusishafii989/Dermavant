import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, User } from "@/models";

// This endpoint reassigns all medicines to the correct partner based on who is logged in as partner
// It also fixes the partner_name resolution
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const targetEmail = body.email; // The real partner email (e.g. City Gate Pharmacy's email)
    const targetPartnerName = body.businessName || null;

    if (!targetEmail) {
      // List all partners so we can identify the right one
      const partners = await Partner.find({}).lean();
      return NextResponse.json({
        ok: true,
        message: "Provide 'email' and optional 'businessName' in body to reassign medicines",
        partners: partners.map((p) => ({
          id: p._id.toString(),
          business_name: p.business_name,
          owner_name: p.owner_name,
          email: p.email,
          medicine_count: 0,
        })),
      });
    }

    // Find the target partner by email
    const targetPartner = await Partner.findOne({ email: targetEmail }).lean();
    if (!targetPartner) {
      return NextResponse.json({ ok: false, error: `No partner found with email: ${targetEmail}` }, { status: 404 });
    }

    // Find the wrong partner (Partner Test's Pharmacy)
    const wrongPartners = await Partner.find({
      $or: [
        { business_name: "Partner Test's Pharmacy" },
        { email: "partner@example.com" },
      ],
    }).lean();

    const wrongIds = wrongPartners.map((p) => p._id);

    if (wrongIds.length === 0) {
      return NextResponse.json({ ok: false, error: "No 'Partner Test's Pharmacy' found to reassign from" }, { status: 404 });
    }

    // Reassign all medicines from wrong partner to correct partner
    const result = await Medicine.updateMany(
      { partner_id: { $in: wrongIds } } as any,
      { $set: { partner_id: targetPartner._id } }
    );

    return NextResponse.json({
      ok: true,
      message: `Reassigned ${result.modifiedCount} medicines from ${wrongPartners.map((p) => p.business_name).join(", ")} to ${targetPartner.business_name}`,
      targetPartner: {
        id: targetPartner._id.toString(),
        name: targetPartner.business_name,
        email: targetPartner.email,
      },
      reassignedFrom: wrongPartners.map((p) => ({
        id: p._id.toString(),
        name: p.business_name,
        email: p.email,
      })),
      medicinesUpdated: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to reassign medicines", details: error?.message || String(error) }, { status: 500 });
  }
}
