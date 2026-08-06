import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Patient, User } from "@/models";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let userDoc: any = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }
      const fullName =
        clerkUser.fullName ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        "Patient User";

      userDoc = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName,
        role: "patient",
      });
    }

    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Failed to resolve user account" }, { status: 500 });
    }

    let patientDoc: any = await Patient.findOne({ user_id: userDoc._id }).lean();
    if (!patientDoc) {
      patientDoc = await Patient.create({
        user_id: userDoc._id,
        blood_group: "O+",
        allergies: [],
        chronic_conditions: [],
        current_medications: [],
        past_surgeries: [],
        blood_pressure: "120/80 mmHg",
        primary_physician: "",
        emergency_contact: { name: "", phone: "" },
      } as any);
    }

    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Failed to resolve patient profile" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        _id: patientDoc._id.toString(),
        patient_id: patientDoc.patient_id,
        fullName: userDoc.fullName || "",
        email: userDoc.email || "",
        phone: userDoc.phone || "",
        blood_group: patientDoc.blood_group || "O+",
        height: patientDoc.height || 170,
        weight: patientDoc.weight || 70,
        blood_pressure: patientDoc.blood_pressure || "120/80 mmHg",
        primary_physician: patientDoc.primary_physician || "",
        allergies: patientDoc.allergies || [],
        chronic_conditions: patientDoc.chronic_conditions || [],
        current_medications: patientDoc.current_medications || [],
        past_surgeries: patientDoc.past_surgeries || [],
        emergency_contact: patientDoc.emergency_contact || { name: "", phone: "" },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load patient profile", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId });
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User account not found" }, { status: 404 });
    }

    if (body.fullName || body.phone) {
      if (body.fullName) userDoc.fullName = body.fullName;
      if (body.phone) userDoc.phone = body.phone;
      await userDoc.save();
    }

    let patientDoc = await Patient.findOne({ user_id: userDoc._id as any });
    if (!patientDoc) {
      patientDoc = new Patient({
        user_id: userDoc._id,
      });
    }

    if (body.blood_group !== undefined) patientDoc.blood_group = body.blood_group;
    if (body.height !== undefined) patientDoc.height = Number(body.height);
    if (body.weight !== undefined) patientDoc.weight = Number(body.weight);
    if (body.blood_pressure !== undefined) patientDoc.blood_pressure = body.blood_pressure;
    if (body.primary_physician !== undefined) patientDoc.primary_physician = body.primary_physician;
    if (Array.isArray(body.allergies)) patientDoc.allergies = body.allergies;
    if (Array.isArray(body.chronic_conditions)) patientDoc.chronic_conditions = body.chronic_conditions;
    if (Array.isArray(body.current_medications)) patientDoc.current_medications = body.current_medications;
    if (Array.isArray(body.past_surgeries)) patientDoc.past_surgeries = body.past_surgeries;
    if (body.emergency_contact) {
      patientDoc.emergency_contact = {
        name: body.emergency_contact.name || "",
        phone: body.emergency_contact.phone || "",
      };
    }

    await patientDoc.save();

    return NextResponse.json({
      ok: true,
      profile: {
        _id: patientDoc._id.toString(),
        patient_id: patientDoc.patient_id,
        fullName: userDoc.fullName || "",
        email: userDoc.email || "",
        phone: userDoc.phone || "",
        blood_group: patientDoc.blood_group,
        height: patientDoc.height,
        weight: patientDoc.weight,
        blood_pressure: patientDoc.blood_pressure,
        primary_physician: patientDoc.primary_physician,
        allergies: patientDoc.allergies,
        chronic_conditions: patientDoc.chronic_conditions,
        current_medications: patientDoc.current_medications,
        past_surgeries: patientDoc.past_surgeries,
        emergency_contact: patientDoc.emergency_contact,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update patient profile", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
