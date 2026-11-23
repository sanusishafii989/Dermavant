import mongoose from "mongoose";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { COMMISSION } from "@/lib/commission";
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
    const wallet = await Wallet.findOne({ ownerId: userDoc._id as any });
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Wallet not found. Please top up first." }, { status: 400 });
    }

    const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patient) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    if (type === "appointment") {
      // Pay for appointment from wallet
      const aptFilter = mongoose.Types.ObjectId.isValid(String(appointmentId))
        ? { $or: [{ _id: appointmentId }, { appointment_id: appointmentId }] }
        : { appointment_id: appointmentId };
      const appointment = await Appointment.findOne({
        ...aptFilter,
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

      // Atomic debit: only succeeds if balance >= amount
      const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id as any, balance: { $gte: amount } } as any,
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!updatedWallet) {
        return NextResponse.json({
          ok: false,
          error: `Insufficient balance. You need ₦${amount.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}`,
        }, { status: 400 });
      }

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

      // Credit doctor wallet atomically
      const doctorEarnings = Math.round(amount * (100 - COMMISSION.DOCTOR_RATE) / 100);
      let doctorWallet = await Wallet.findOne({ ownerId: doctor?.user_id as any });
      if (!doctorWallet) {
        doctorWallet = await Wallet.create({
          ownerId: doctor?.user_id,
          ownerRole: "doctor",
          balance: 0,
          currency: "NGN",
        } as any);
      }
      await Wallet.updateOne(
        { _id: doctorWallet._id as any },
        { $inc: { balance: doctorEarnings } }
      );

      try {
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
          commission_rate: COMMISSION.DOCTOR_RATE,
          commission_amount: amount - doctorEarnings,
        },
      } as any);
      } catch (err) {
        console.error(
          `[WALLET PAYMENT] CRITICAL: Doctor wallet credited ₦${doctorEarnings} but ledger creation FAILED for appointment ${appointment._id}:`,
          err
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Payment successful from wallet",
        newBalance: updatedWallet.balance,
        redirectUrl: `/patient/dashboard/payment/success?reference=${reference}&status=success`,
      });
    }

    if (type === "pharmacy") {
      // Pay for pharmacy order from wallet
      const orderFilter = mongoose.Types.ObjectId.isValid(String(orderId))
        ? { $or: [{ _id: orderId }, { order_id: orderId }] }
        : { order_id: orderId };
      const order = await PharmacyOrder.findOne({
        ...orderFilter,
        patient_id: patient._id as any,
      } as any);

      if (!order) {
        return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
      }

      if (order.payment_status === "paid") {
        return NextResponse.json({ ok: false, error: "Order already paid" }, { status: 400 });
      }

      const amount = order.total;

      // Atomic debit: only succeeds if balance >= amount
      const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id as any, balance: { $gte: amount } } as any,
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!updatedWallet) {
        return NextResponse.json({
          ok: false,
          error: `Insufficient balance. You need ₦${amount.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}`,
        }, { status: 400 });
      }

      // Atomic idempotency guard: only one request can transition payment_status from "pending" → "paid"
      const paymentRef = `WLT-${order.order_id}-${Date.now()}`;
      const paidOrder = await PharmacyOrder.findOneAndUpdate(
        { _id: order._id as any, payment_status: "pending" } as any,
        { $set: { payment_status: "paid", payment_reference: paymentRef } },
        { new: true }
      ).lean();

      if (!paidOrder) {
        // Concurrent request already paid this order — refund the wallet debit
        await Wallet.updateOne(
          { _id: wallet._id as any },
          { $inc: { balance: amount } }
        );
        return NextResponse.json({ ok: false, error: "Order already paid" }, { status: 400 });
      }

      // Reduce medicine quantities atomically with sufficiency check
      const stockFailures: { medicine_id: any; name: string; qty: number }[] = [];
      for (const item of paidOrder.items) {
        const stockResult = await Medicine.updateOne(
          { _id: item.medicine_id, quantity: { $gte: item.qty } } as any,
          { $inc: { quantity: -item.qty } }
        );
        if (stockResult.matchedCount === 0) {
          stockFailures.push({ medicine_id: item.medicine_id, name: item.name, qty: item.qty });
        }
      }

      if (stockFailures.length > 0) {
        console.error(
          `[WALLET PAYMENT] Insufficient stock for order ${paidOrder.order_id}:`,
          stockFailures.map((f) => `${f.name} (needed: ${f.qty})`).join(", ")
        );
        // Reverse: mark order as failed and refund the patient wallet
        await PharmacyOrder.updateOne(
          { _id: paidOrder._id as any },
          { $set: { payment_status: "failed" } }
        );
        await Wallet.updateOne(
          { _id: wallet._id as any },
          { $inc: { balance: amount } }
        );
        return NextResponse.json({
          ok: false,
          error: `Insufficient stock for: ${stockFailures.map((f) => f.name).join(", ")}. Payment reversed.`,
        }, { status: 400 });
      }

      // Credit partner wallet atomically (ownerId = Partner._id, consistent with lib/paystack.ts)
      const partnerEarnings = Math.round(amount * (100 - COMMISSION.PHARMACY_RATE) / 100);

      let partnerWallet = await Wallet.findOne({ ownerId: paidOrder.partner_id as any });
      if (!partnerWallet) {
        partnerWallet = await Wallet.create({
          ownerId: paidOrder.partner_id,
          ownerRole: "partner",
          balance: 0,
          currency: "NGN",
        } as any);
      }
      await Wallet.updateOne(
        { _id: partnerWallet._id as any },
        { $inc: { balance: partnerEarnings } }
      );

      try {
        await WalletTransaction.create({
          wallet_id: partnerWallet._id,
          patient_id: patient._id,
          type: "pharmacy_purchase",
          amount: partnerEarnings,
          direction: "credit",
          currency: "NGN",
          status: "completed",
          reference: `PHARM-SALE-${paidOrder.order_id}-${Date.now()}`,
          description: `Pharmacy order ${paidOrder.order_id} — ${paidOrder.items.length} items`,
          metadata: {
            order_id: paidOrder.order_id,
            gross_amount: amount,
            commission_rate: COMMISSION.PHARMACY_RATE,
            commission_amount: amount - partnerEarnings,
          },
        } as any);
      } catch (err) {
        console.error(
          `[WALLET PAYMENT] CRITICAL: Partner wallet credited ₦${partnerEarnings} but ledger creation FAILED for order ${paidOrder.order_id}:`,
          err
        );
      }

      // Credit commission to company/admin wallet (fixed ownerId for deterministic lookup)
      const commissionAmount = amount - partnerEarnings;
      if (commissionAmount > 0) {
        const COMPANY_WALLET_OWNER_ID = "000000000000000000000000";
        let adminWallet = await Wallet.findOne({ ownerId: COMPANY_WALLET_OWNER_ID as any, ownerRole: "admin" as any }).lean();
        if (!adminWallet) {
          const created = await Wallet.create({
            ownerId: COMPANY_WALLET_OWNER_ID,
            ownerRole: "admin",
            balance: 0,
            currency: "NGN",
          } as any);
          adminWallet = created.toObject();
        }

        await Wallet.updateOne(
          { _id: adminWallet._id as any },
          { $inc: { balance: commissionAmount } }
        );

        try {
          await WalletTransaction.create({
            wallet_id: adminWallet._id,
            patient_id: patient._id,
            type: "bonus",
            amount: commissionAmount,
            direction: "credit",
            currency: "NGN",
            status: "completed",
            reference: `COMM-PHARM-${paidOrder.order_id}-${Date.now()}`,
            description: `${COMMISSION.PHARMACY_RATE}% platform commission from pharmacy order ${paidOrder.order_id}`,
            metadata: {
              order_id: paidOrder.order_id,
              gross_amount: amount,
              commission_rate: COMMISSION.PHARMACY_RATE,
              source: "pharmacy_commission",
            },
          } as any);
        } catch (err) {
          console.error(
            `[WALLET PAYMENT] CRITICAL: Admin wallet credited ₦${commissionAmount} but ledger creation FAILED for order ${paidOrder.order_id}:`,
            err
          );
        }
      }

      // Record patient debit transaction
      await WalletTransaction.create({
        wallet_id: wallet._id,
        patient_id: patient._id,
        type: "pharmacy_purchase",
        amount,
        direction: "debit",
        currency: "NGN",
        status: "completed",
        reference: `WLT-PHARM-${paidOrder.order_id}-${Date.now()}`,
        description: `Pharmacy order — ${paidOrder.items.length} items`,
        metadata: { order_id: paidOrder.order_id, payment_method: "wallet" },
      } as any);

      return NextResponse.json({
        ok: true,
        message: "Payment successful from wallet",
        newBalance: updatedWallet.balance,
        redirectUrl: `/patient/dashboard/payment/success?reference=${paymentRef}&status=success`,
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
