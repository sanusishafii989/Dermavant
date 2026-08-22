import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Doctor, Patient, Partner, Wallet, Admin } from "@/models";

type SeedResult = {
  role: string;
  ok: boolean;
  reason?: string;
  userId?: string;
  roleDocId?: string;
  walletId?: string;
};

const ROLE_CONFIG = [
  {
    role: "admin",
    clerkIdEnv: "ADMIN_CLERK_ID",
    emailEnv: "ADMIN_EMAIL",
    nameEnv: "ADMIN_FULLNAME",
  },
  {
    role: "doctor",
    clerkIdEnv: "DOCTOR_CLERK_ID",
    emailEnv: "DOCTOR_EMAIL",
    nameEnv: "DOCTOR_FULLNAME",
  },
  {
    role: "patient",
    clerkIdEnv: "PATIENT_CLERK_ID",
    emailEnv: "PATIENT_EMAIL",
    nameEnv: "PATIENT_FULLNAME",
  },
  {
    role: "partner",
    clerkIdEnv: "PARTNER_CLERK_ID",
    emailEnv: "PARTNER_EMAIL",
    nameEnv: "PARTNER_FULLNAME",
  },
];

/**
 * Dev-only endpoint to seed admin, doctor, patient, and partner records.
 * This persists real documents in MongoDB via Mongoose.
 */
export async function POST(req: Request) {
  try {
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
    } catch (error: any) {
      return NextResponse.json(
        {
          ok: false,
          error: "Database connection failed",
          details: error?.message || String(error),
        },
        { status: 503 }
      );
    }

    const results: SeedResult[] = [];

    for (const cfg of ROLE_CONFIG) {
      const clerkId = process.env[cfg.clerkIdEnv as keyof typeof process.env];
      const email = process.env[cfg.emailEnv as keyof typeof process.env] || `${cfg.role}@example.com`;
      const fullName = process.env[cfg.nameEnv as keyof typeof process.env] || `${cfg.role[0].toUpperCase()}${cfg.role.slice(1)} Test`;

      if (!clerkId) {
        results.push({ role: cfg.role, ok: false, reason: `${cfg.clerkIdEnv} not configured` });
        continue;
      }

      try {
        let user = await User.findOne({ clerkId });
        if (!user) {
          user = await User.create({ clerkId, fullName, email, role: cfg.role as any, status: "active" });
        }

        let wallet = await Wallet.findOne({ ownerId: user._id as any });
        if (!wallet) {
          wallet = await Wallet.create({ ownerId: user._id, ownerRole: cfg.role as any, balance: 0, currency: "NGN" });
        }

        let roleDocId: string | undefined;
        if (cfg.role === "admin") {
          let adminDoc = await Admin.findOne({ userId: user._id as any });
          if (!adminDoc) {
            adminDoc = await Admin.create({ userId: user._id as any, adminLevel: "super", permissions: [] });
          }
          roleDocId = adminDoc._id.toString();
        }

        if (cfg.role === "doctor") {
          let doc = await Doctor.findOne({ user_id: user._id as any });
          if (!doc) {
            doc = await Doctor.create({ user_id: user._id as any, license_number: "PENDING", specialization: "General Practice" });
          }
          roleDocId = doc._id.toString();
        }

        if (cfg.role === "patient") {
          let pat = await Patient.findOne({ user_id: user._id as any });
          if (!pat) {
            pat = await Patient.create({ user_id: user._id as any, blood_group: "O+" });
          }
          roleDocId = pat._id.toString();
        }

        if (cfg.role === "partner") {
          let partnerDoc = await Partner.findOne({ email });
          if (!partnerDoc) {
            partnerDoc = await Partner.create({
              business_name: `${fullName}'s Pharmacy`,
              license: "PENDING",
              owner_name: fullName,
              email,
              phone: "0000000000",
              address: "",
              rating: 0,
              status: "pending",
            });
          }
          roleDocId = partnerDoc._id.toString();
        }

        results.push({ role: cfg.role, ok: true, userId: user._id.toString(), roleDocId, walletId: wallet._id.toString() });
      } catch (err: any) {
        results.push({ role: cfg.role, ok: false, reason: String(err?.message ?? err) });
      }
    }

    return NextResponse.json({ ok: true, results, createdRoles: results.filter((item) => item.ok).map((item) => item.role) });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seed route failed",
        details: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
