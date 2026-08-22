import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine, Partner } from "@/models";

const SEED_MEDICINES = [
  {
    name: "Paracetamol 500mg",
    brand: "HealthPlus",
    category: "Pain Relief",
    price: 120,
    quantity: 150,
    image: "/placeholder-pill.svg",
    description: "Effective relief from mild to moderate pain and fever.",
  },
  {
    name: "Amoxicillin 500mg",
    brand: "MediCare",
    category: "Antibiotic",
    price: 450,
    quantity: 80,
    image: "/placeholder-pill.svg",
    description: "Broad spectrum antibiotic for bacterial infections.",
  },
  {
    name: "Vitamin C 1000mg",
    brand: "NutriLife",
    category: "Supplements",
    price: 250,
    quantity: 220,
    image: "/placeholder-pill.svg",
    description: "Immune support supplement with antioxidant benefits.",
  },
  {
    name: "Cough Syrup",
    brand: "Soothe",
    category: "Cold & Flu",
    price: 380,
    quantity: 120,
    image: "/placeholder-pill.svg",
    description: "Soothes cough and relieves throat irritation.",
  },
];

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev endpoints are disabled in production" }, { status: 403 });
  }

  if (process.env.DEV_SEED_ROLES !== "true") {
    return NextResponse.json({ error: "DEV_SEED_ROLES is not enabled" }, { status: 403 });
  }

  const seedSecret = req.headers.get("x-seed-secret") || "";
  if (!process.env.DEV_SEED_SECRET || seedSecret !== process.env.DEV_SEED_SECRET) {
    return NextResponse.json({ error: "Invalid or missing seed secret" }, { status: 401 });
  }

  try {
    await connectDB();

    let partner = await Partner.findOne({ status: "verified" }).lean();
    if (!partner) {
      const partnerName = process.env.PARTNER_FULLNAME || "Seed Pharmacy";
      const partnerEmail = process.env.PARTNER_EMAIL || "partner@example.com";
      const partnerPhone = process.env.PARTNER_PHONE || "08000000000";
      const partnerAddress = process.env.PARTNER_ADDRESS || "123 Seed Street";

      const existingPartner = await Partner.findOne({ email: partnerEmail }).lean();
      if (existingPartner) {
        partner = existingPartner;
      } else {
        const createdPartner = await Partner.create({
          business_name: `${partnerName}'s Pharmacy`,
          license: "PENDING",
          owner_name: partnerName,
          email: partnerEmail,
          phone: partnerPhone,
          address: partnerAddress,
          rating: 4.5,
          status: "verified",
          latitude: 0,
          longitude: 0,
        } as any);

        partner = createdPartner.toObject();
      }
    }

    const createdMedicines = [];
    for (const seed of SEED_MEDICINES) {
      const existing = await Medicine.findOne({ name: seed.name, brand: seed.brand }).lean();
      if (existing) {
        createdMedicines.push({ ...existing, skipped: true });
        continue;
      }

      const medicine = await Medicine.create({
        partner_id: partner._id,
        name: seed.name,
        brand: seed.brand,
        category: seed.category,
        price: seed.price,
        quantity: seed.quantity,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        image: seed.image,
        description: seed.description,
        status: "active",
      } as any);
      createdMedicines.push({ ...medicine.toObject(), skipped: false });
    }

    return NextResponse.json({ ok: true, created: createdMedicines.length, medicines: createdMedicines });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to seed medicines", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
