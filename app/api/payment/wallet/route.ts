import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, PharmacyOrder, Medicine, User, Wallet, WalletTransaction, Payment } from "@/models";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, appointmentId, orderId } = body;

    await connectDB();

    const clerkUser = await currentUser();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Get patient's wallet
    let wallet = await Wallet.findOne({ ownerId: userDoc._id as any });
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Wallet not found. Please top up first." }, { status: 400 });
    }

    const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patient) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    if (type === "appointment") {
      // Pay for appointment from wallet
      const appointment = await Appointment.findOne({
        $or: [{ _id: appointmentId }, { appointment_id: appointmentId }],
        patient_id: patient._id as any,
      } as any);

      if (!appointment) {
        return NextResponse.json({ ok: false, error: "Appointment not found" }, { status: 404 });
      }

      if (appointment.payment_status === "paid") {
        return NextResponse.json({ ok: false, error: "Appointment already paid" }, { status: 400 });
      }

      const doctor = await Doctor.findById(appointment.doctor_id as any).lean();
      const amount = doctor?.consultation_fee ?? 5000;

      if (wallet.balance < amount) {
        return NextResponse.json({
          ok: false,
          error: `Insufficient balance. You need ₦${amount.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}`,
        }, { status: 400 });
      }

      // Debit patient wallet
      wallet.balance -= amount;
      await wallet.save();

      // Mark appointment as paid
      await Appointment.updateOne({ _id: appointment._id as any }, { $set: { payment_status: "paid" } });

      // Record payment
      const reference = `WLT-APT-${appointment._id}-${Date.now()}`;
      await Payment.create({
        appointment_id: appointment._id,
        reference,
        amount,
        currency: "NGN",
        gateway: "wallet",
        status: "success",
        channel: "wallet",
        email: userDoc.email,
        paid_at: new Date(),
      } as any);

      // Record wallet transaction
      await WalletTransaction.create({
        wallet_id: wallet._id,
        patient_id: patient._id,
        type: "consultation_fee",
        amount,
        direction: "debit",
        currency: "NGN",
        status: "completed",
        reference,
        description: `Consultation payment — ${doctor?.specialization || "Doctor"}`,
        metadata: { appointment_id: appointment._id.toString(), payment_method: "wallet" },
      } as any);

      // Credit doctor wallet (90% after 10% commission)
      const DOCTOR_COMMISSION = 10;
      const doctorEarnings = Math.round(amount * (100 - DOCTOR_COMMISSION) / 100);
      let doctorWallet = await Wallet.findOne({ ownerId: doctor?.user_id as any });
      if (!doctorWallet) {
        doctorWallet = await Wallet.create({
          ownerId: doctor?.user_id,
          ownerRole: "doctor",
          balance: 0,
          currency: "NGN",
        } as any);
      }
      doctorWallet.balance += doctorEarnings;
      await doctorWallet.save();

      await WalletTransaction.create({
        wallet_id: doctorWallet._id,
        patient_id: patient._id,
        type: "consultation_fee",
        amount: doctorEarnings,
        direction: "credit",
        currency: "NGN",
        status: "completed",
        reference: `DOC-EARN-${appointment._id}-${Date.now()}`,
        description: `Consultation earnings — ${userDoc.fullName}`,
        metadata: {
          appointment_id: appointment._id.toString(),
          gross_amount: amount,
          commission_rate: DOCTOR_COMMISSION,
          commission_amount: amount - doctorEarnings,
        },
      } as any).catch(() => {});

      return NextResponse.json({
        ok: true,
        message: "Payment successful from wallet",
        newBalance: wallet.balance,
        redirectUrl: `/patient/dashboard/payment/success?reference=${reference}&status=success`,
      });
    }

    if (type === "pharmacy") {
      // Pay for pharmacy order from wallet
      const order = await PharmacyOrder.findOne({
        $or: [{ _id: orderId }, { order_id: orderId }],
        patient_id: patient._id as any,
      } as any);

      if (!order) {
        return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
      }

      if (order.payment_status === "paid") {
        return NextResponse.json({ ok: false, error: "Order already paid" }, { status: 400 });
      }

      const amount = order.total;

      if (wallet.balance < amount) {
        return NextResponse.json({
          ok: false,
          error: `Insufficient balance. You need ₦${amount.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}`,
        }, { status: 400 });
      }

      // Debit patient wallet
      wallet.balance -= amount;
      await wallet.save();

      // Mark order as paid
      await PharmacyOrder.updateOne(
        { _id: order._id as any },
        { $set: { payment_status: "paid", payment_reference: `WLT-${order.order_id}-${Date.now()}` } }
      );

      // Reduce medicine quantities
      for (const item of order.items) {
        await Medicine.updateOne(
          { _id: item.medicine_id } as any,
          { $inc: { quantity: -item.qty } }
        ).catch(() => {});
      }

      // Credit partner wallet (95% after 5% commission)
      const PHARMACY_COMMISSION = 5;
      const partnerEarnings = Math.round(amount * (100 - PHARMACY_COMMISSION) / 100);

      let partnerWallet = await Wallet.findOne({ ownerId: order.partner_id as any });
      if (!partnerWallet) {
        // Find the partner's user_id from Partner model
        const { Partner } = await import("@/models");
        const partner = await Partner.findById(order.partner_id).lean();
        const partnerUserId = partner?.user_id || order.partner_id;

        partnerWallet = await Wallet.create({
          ownerId: partnerUserId,
          ownerRole: "partner",
          balance: 0,
          currency: "NGN",
        } as any);
      }
      partnerWallet.balance += partnerEarnings;
      await partnerWallet.save();

      await WalletTransaction.create({
        wallet_id: partnerWallet._id,
        patient_id: patient._id,
        type: "pharmacy_purchase",
        amount: partnerEarnings,
        direction: "credit",
        currency: "NGN",
        status: "completed",
        reference: `PHARM-SALE-${order.order_id}-${Date.now()}`,
        description: `Pharmacy order ${order.order_id} — ${order.items.length} items`,
        metadata: {
          order_id: order.order_id,
          gross_amount: amount,
          commission_rate: PHARMACY_COMMISSION,
          commission_amount: amount - partnerEarnings,
        },
      } as any).catch(() => {});

      // Record patient debit transaction
      await WalletTransaction.create({
        wallet_id: wallet._id,
        patient_id: patient._id,
        type: "pharmacy_purchase",
        amount,
        direction: "debit",
        currency: "NGN",
        status: "completed",
        reference: `WLT-PHARM-${order.order_id}-${Date.now()}`,
        description: `Pharmacy order — ${order.items.length} items`,
        metadata: { order_id: order.order_id, payment_method: "wallet" },
      } as any);

      return NextResponse.json({
        ok: true,
        message: "Payment successful from wallet",
        newBalance: wallet.balance,
        redirectUrl: `/patient/dashboard/payment/success?reference=WLT-${order.order_id}-${Date.now()}&status=success`,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid payment type" }, { status: 400 });
  } catch (error: any) {
    console.error("[WALLET PAYMENT] Error:", error?.message || String(error));
    return NextResponse.json(
      { ok: false, error: "Failed to process wallet payment", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
