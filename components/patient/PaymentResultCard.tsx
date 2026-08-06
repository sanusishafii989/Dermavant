"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  mode: "success" | "failed";
};

type PaymentPurpose = "appointment_payment" | "pharmacy_order";

export function PaymentResultCard({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment…");
  const [purpose, setPurpose] = useState<PaymentPurpose>("appointment_payment");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference") || "";
    const paystackStatus = searchParams.get("status") || "";

    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference was returned from Paystack.");
      return;
    }

    if (paystackStatus && paystackStatus !== "success") {
      router.replace(`/patient/dashboard/payment/failed?reference=${encodeURIComponent(reference)}`);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/payment/paystack/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reference }),
        });

        const payload = await response.json();
        if (!response.ok || !payload.ok || payload.paymentStatus !== "success") {
          setStatus("failed");
          setMessage(payload.error || "Payment verification failed. Please contact support if the charge already went through.");
          router.replace(`/patient/dashboard/payment/failed?reference=${encodeURIComponent(reference)}`);
          return;
        }

        const paymentPurpose = payload.purpose || payload.metadata?.purpose || payload.payment?.metadata?.purpose || "appointment_payment";
        setPurpose(paymentPurpose);

        if (paymentPurpose === "pharmacy_order") {
          const foundOrderId = payload.orderId || payload.metadata?.order_id || payload.metadata?.order_db_id || payload.payment?.order_id;
          if (foundOrderId) setOrderId(foundOrderId);
          setStatus("success");
          setMessage(
            foundOrderId
              ? `Payment confirmed. Your pharmacy order ${foundOrderId} is now confirmed.`
              : "Payment confirmed. Your pharmacy order is now confirmed."
          );
        } else {
          setStatus("success");
          setMessage("Payment confirmed. Your appointment is now marked paid.");
        }
      } catch (error: any) {
        setStatus("failed");
        setMessage(error?.message || "Payment verification failed. Please try again in a moment.");
      }
    };

    void verifyPayment();
  }, [mode, router, searchParams]);

  return (
    <Card className="max-w-3xl">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-cyan)]">Payment update</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {status === "success" ? "Payment successful" : status === "failed" ? "Payment issue" : "Checking payment status"}
          </h1>
        </div>

        <div
          className={`rounded-2xl border px-4 py-4 text-sm font-medium ${
            status === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          {message}
        </div>

        {status === "success" ? (
          <div className="flex flex-wrap gap-3">
            <Link href="/patient/dashboard">
              <Button variant="gold">Return to dashboard</Button>
            </Link>
          </div>
        ) : null}

        {status === "failed" ? (
          <div className="flex flex-wrap gap-3">
            <Link href="/patient/dashboard">
              <Button variant="gold">Return to dashboard</Button>
            </Link>
            <Link href="/patient/dashboard/book-specialist">
              <Button variant="primary">Try booking again</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
