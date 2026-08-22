import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, User } from "@/models";

async function checkDevAdmin() {
  if (process.env.NODE_ENV === "production") {
    return { error: NextResponse.json({ ok: false, error: "Dev endpoints are disabled in production" }, { status: 403 }) };
  }
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  await connectDB();
  const adminDoc = await User.findOne({ clerkId: userId }).lean();
  if (!adminDoc || adminDoc.role !== "admin") {
    return { error: NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 }) };
  }
  return { adminDoc };
}

// Reassign all medicines from one partner to another
export async function POST(req: Request) {
  try {
    const guard = await checkDevAdmin();
    if ("error" in guard) return guard.error;

    const body = await req.json();
    const { fromPartnerEmail, toPartnerEmail } = body;

    if (!fromPartnerEmail || !toPartnerEmail) {
      return NextResponse.json(
        { ok: false, error: "fromPartnerEmail and toPartnerEmail are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const fromPartner = await Partner.findOne({ email: fromPartnerEmail }).lean();
    const toPartner = await Partner.findOne({ email: toPartnerEmail }).lean();

    if (!fromPartner) {
      return NextResponse.json({ ok: false, error: `Source partner not found: ${fromPartnerEmail}` }, { status: 404 });
    }
    if (!toPartner) {
      return NextResponse.json({ ok: false, error: `Target partner not found: ${toPartnerEmail}` }, { status: 404 });
    }

    const result = await Medicine.updateMany(
      { partner_id: fromPartner._id as any } as any,
      { $set: { partner_id: toPartner._id } }
    );

    return NextResponse.json({
      ok: true,
      message: `Reassigned ${result.modifiedCount} medicines from "${fromPartner.business_name}" to "${toPartner.business_name}"`,
      fromPartner: { id: fromPartner._id.toString(), name: fromPartner.business_name, email: fromPartner.email },
      toPartner: { id: toPartner._id.toString(), name: toPartner.business_name, email: toPartner.email },
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to reassign medicines", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// List all partners with their medicine counts
export async function GET() {
  try {
    const guard = await checkDevAdmin();
    if ("error" in guard) return guard.error;

    await connectDB();
    const partners = await Partner.find({}).lean();
    const result = [];
    for (const p of partners) {
      const count = await Medicine.countDocuments({ partner_id: p._id as any } as any);
      result.push({
        id: p._id.toString(),
        business_name: p.business_name,
        email: p.email,
        owner_name: p.owner_name,
        status: p.status,
        medicine_count: count,
      });
    }
    return NextResponse.json({ ok: true, partners: result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to list partners", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
