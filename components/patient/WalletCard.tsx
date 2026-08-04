"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, PlusCircle, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { WalletTransactionItem } from "@/types/history";

interface WalletCardProps {
  balance: number;
  currency: string;
  transactions: WalletTransactionItem[];
  onRefresh?: () => void;
}

export function WalletCard({ balance, currency, transactions, onRefresh }: WalletCardProps) {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCurrency = (val: number, cur: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: cur === "NGN" ? "NGN" : cur,
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid positive amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/patient/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, description: "Patient wallet top-up" }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to initialize top-up payment");
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }

      setIsTopUpOpen(false);
      setTopUpAmount("5000");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Hero Card */}
      <Card className="relative overflow-hidden border border-cyan/30 bg-gradient-to-r from-navy via-dark to-cyan/10 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan">
              <Wallet className="h-4 w-4" />
              <span>Aetheris Patient E-Wallet</span>
            </div>
            <div className="mt-3">
              <p className="text-xs text-white/50">Available Balance</p>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                {formatCurrency(balance, currency)}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsTopUpOpen(true)}
              className="flex items-center gap-2 shadow-lg shadow-cyan/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Funds</span>
            </Button>
            {onRefresh && (
              <Button variant="secondary" onClick={onRefresh} className="flex items-center gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Amount Selection & Modal */}
      <Modal open={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title="Fund Your E-Wallet">
        <form onSubmit={handleTopUp} className="space-y-5">
          <p className="text-xs text-white/70">
            Top up your balance for instant consultations, pharmacy orders, and specialist bookings.
          </p>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">Select Preset Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt.toString())}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    topUpAmount === amt.toString()
                      ? "border-cyan bg-cyan/20 text-cyan"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">Custom Amount (NGN)</label>
            <Input
              type="number"
              min="100"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          {errorMsg && <p className="text-xs font-medium text-red-400">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="secondary" type="button" onClick={() => setIsTopUpOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Top-Up"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction History Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Transaction History</h3>
          <span className="text-xs text-white/50">{transactions.length} Transactions</span>
        </div>

        {transactions.length === 0 ? (
          <Card className="border-dashed border-white/10 p-8 text-center text-white/50">
            <CreditCard className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-2 text-xs font-medium">No transactions recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-dark/60 p-4 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl border p-2.5 ${
                      tx.direction === "credit"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {tx.direction === "credit" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {tx.description || (tx.direction === "credit" ? "Account Credit" : "Account Debit")}
                      </p>
                      <Badge variant={tx.direction === "credit" ? "cyan" : "gold"} className="text-[10px]">
                        {tx.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">
                      Ref: <span className="font-mono text-white/60">{tx.reference}</span> •{" "}
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end">
                  <span
                    className={`text-base font-extrabold ${
                      tx.direction === "credit" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-emerald-400">
                    {tx.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
