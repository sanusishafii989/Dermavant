import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine, Partner } from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";

    const filter: any = { status: "active" };
    if (query) {
      filter.$text = { $search: query };
    }

    const medicines = await Medicine.find(filter).lean();
    const partnerIds = medicines.map((item) => item.partner_id).filter(Boolean);
    const partners = await Partner.find({ _id: { $in: partnerIds } } as any).lean();

    const partnerMap = new Map(partners.map((partner) => [partner._id.toString(), partner.business_name]));

    return NextResponse.json({
      ok: true,
      medicines: medicines.map((medicine) => ({
        ...medicine,
        image: medicine.image && medicine.image !== "/placeholder-pill.png" ? medicine.image : "/placeholder-pill.svg",
        partner_name: partnerMap.get(medicine.partner_id?.toString?.() || "") || "Unknown",
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Unable to search medicines", details: error?.message || String(error) }, { status: 500 });
  }
}
