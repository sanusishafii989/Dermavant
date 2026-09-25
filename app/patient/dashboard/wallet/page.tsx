"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { WalletCard } from "@/components/patient/WalletCard";
import { Card } from "@/components/ui/Card";
import { patientNavLinks } from "@/lib/portal-nav";
import type { WalletTransactionItem } from "@/types/history";
import { CheckCircle2, RefreshCw } from "lucide-react";

function WalletContent() {
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("NGN");
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/patient/wallet");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch wallet information");
      }

      setBalance(data.balance || 0);
      setCurrency(data.currency || "NGN");
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const reference = searchParams?.get("reference");
    if (reference) {
      const verifyPayment = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/payment/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });

          const data = await res.json();
          if (res.ok && data.ok) {
            setSuccessMsg("Payment verified! Your e-wallet balance has been updated successfully.");
          } else if (res.status === 404) {
            // Transaction not found on Paystack — webhook may still credit the wallet
            setSuccessMsg("Payment is being processed. If you completed payment, your wallet will be credited shortly.");
          } else {
            setError(data.error || "Unable to verify payment reference. If you completed payment, your wallet will be credited shortly.");
          }
        } catch (err: any) {
          setError(err.message || "Failed to verify top-up payment.");
        } finally {
          // Clean up URL search params without page reload
          window.history.replaceState({}, "", "/patient/dashboard/wallet");
          await fetchWallet();
        }
      };

      verifyPayment();
    } else {
      fetchWallet();
    }
  }, [searchParams]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Patient E-Wallet Ledger"
        description="Manage your balance, add funds via Paystack, and view all consultation & pharmacy transactions."
      />

      {successMsg && (
        <Card className="flex items-center gap-3 border border-success/30 bg-success-bg p-4 text-sm text-success-text">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </Card>
      )}

      {error && (
        <Card className="border border-danger/30 bg-danger-bg p-4 text-sm text-danger-text">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center text-secondary">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-accent-cyan" />
          <p className="mt-3 text-sm font-medium">Processing wallet data...</p>
        </Card>
      ) : (
        <WalletCard
          balance={balance}
          currency={currency}
          transactions={transactions}
          onRefresh={fetchWallet}
        />
      )}
    </div>
  );
}

export default function PatientWalletPage() {
  return (
    <PortalDashboardShell title="E-Wallet Management" links={patientNavLinks}>
      <Suspense fallback={
        <Card className="p-12 text-center text-secondary">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-accent-cyan" />
          <p className="mt-3 text-sm font-medium">Loading e-wallet...</p>
        </Card>
      }>
        <WalletContent />
      </Suspense>
    </PortalDashboardShell>
  );
}
