import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getPaystackSecret, toKobo, validatePaystackEnvKeys } from "@/lib/paystack";
import { Appointment, Doctor, Medicine, Patient, PharmacyOrder, Partner, User } from "@/models";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appointmentIdentifier = body.appointmentId || body.appointment_id;
    const purpose = body.purpose || "appointment_payment";
    const items = body.items || [];
    const deliveryAddress = body.deliveryAddress || "";
    const partnerId = body.partnerId || "";
    const callbackUrl = body.callbackUrl || "";

    if (purpose !== "pharmacy_order" && !appointmentIdentifier) {
      return NextResponse.json({ ok: false, error: "appointmentId is required" }, { status: 400 });
    }

    await connectDB();

    const clerkUser = await currentUser();
    const email = body.email || clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Patient account not found" }, { status: 404 });
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    let amountInKobo = 0;
    let reference = `apt_${appointmentIdentifier}_${Date.now()}`;
    let metadata: any = { purpose, appointment_id: appointmentIdentifier };

    if (purpose === "pharmacy_order") {
      if (!items.length) {
        return NextResponse.json({ ok: false, error: "pharmacy order items are required" }, { status: 400 });
      }

      if (!partnerId) {
        return NextResponse.json({ ok: false, error: "partnerId is required for pharmacy orders" }, { status: 400 });
      }

      const partnerDoc = await Partner.findById(partnerId).lean();
      if (!partnerDoc) {
        return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
      }

      const itemPartnerIds = new Set(items.map((item: any) => item.partnerId));
      if (itemPartnerIds.size > 1 || !itemPartnerIds.has(partnerId)) {
        return NextResponse.json({ ok: false, error: "All pharmacy order items must belong to the same partner" }, { status: 400 });
      }

      // Recalculate total from DB to prevent price tampering
      const medicineIds = items.map((item: any) => item.medicineId);
      const dbMedicines = await Medicine.find({ _id: { $in: medicineIds } as any }).lean();
      const medicineMap = new Map(dbMedicines.map((m: any) => [m._id.toString(), m]));

      let totalAmount = 0;
      const validatedItems = items.map((item: any) => {
        const dbMed = medicineMap.get(item.medicineId);
        const unitPrice = dbMed?.price ?? 0;
        const qty = Number(item.qty) || 1;
        totalAmount += unitPrice * qty;
        return {
          medicine_id: item.medicineId,
          name: dbMed?.name || item.name,
          qty,
          unit_price: unitPrice,
        };
      });

      if (totalAmount <= 0) {
        return NextResponse.json({ ok: false, error: "Order total must be greater than zero" }, { status: 400 });
      }

      const order = await PharmacyOrder.create({
        patient_id: patientDoc._id,
        partner_id: partnerId,
        items: validatedItems,
        total: totalAmount,
        delivery_address: deliveryAddress,
        fulfillment_type: body.fulfillmentType || "delivery",
      } as any);

      reference = `pharm_${order.order_id}_${Date.now()}`;
      metadata = {
        purpose,
        order_id: order.order_id,
        order_db_id: order._id?.toString?.() || order._id,
        items,
        total: totalAmount,
        delivery_address: deliveryAddress,
        partner_id: partnerId,
      };
      amountInKobo = toKobo(totalAmount);
    } else {
      const appointment = await Appointment.findOne({
        $or: [{ _id: appointmentIdentifier }, { appointment_id: appointmentIdentifier }],
      }).lean();

      if (!appointment) {
        return NextResponse.json({ ok: false, error: "Appointment not found" }, { status: 404 });
      }

      if (appointment.patient_id?.toString() !== patientDoc._id.toString()) {
        return NextResponse.json({ ok: false, error: "Appointment does not belong to current user" }, { status: 403 });
      }

      if (appointment.payment_status === "paid") {
        return NextResponse.json({ ok: false, error: "Appointment is already paid" }, { status: 400 });
      }

      const doctorDoc = await Doctor.findById(appointment.doctor_id as any).lean();
      const consultationFee = doctorDoc?.consultation_fee ?? 5000;
      amountInKobo = toKobo(consultationFee);
      metadata = {
        ...metadata,
        appointment_db_id: appointment._id?.toString?.() || appointment._id,
        doctor_id: appointment.doctor_id?.toString?.() || appointment.doctor_id,
        patient_id: appointment.patient_id?.toString?.() || appointment.patient_id,
      };
    }
    const secret = getPaystackSecret();
    const envValidation = validatePaystackEnvKeys();

    if (!secret) {
      return NextResponse.json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured" }, { status: 500 });
    }

    if (!envValidation.ok) {
      return NextResponse.json({ ok: false, error: envValidation.error }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
    const callbackBase = callbackUrl || `${appUrl}/patient/dashboard/payment/success`;
    const callbackUrlWithReference = new URL(callbackBase, appUrl);
    callbackUrlWithReference.searchParams.set("reference", reference);
    callbackUrlWithReference.searchParams.set("status", "success");

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrlWithReference.toString(),
        metadata,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          ok: false,
          error: data.message || "Unable to initialize Paystack payment",
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      authorization_url: data.data.authorization_url,
      reference,
      access_code: data.data.access_code,
      amount: amountInKobo,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to initialize payment",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
