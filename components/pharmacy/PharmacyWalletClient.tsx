"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Clock, Package, ArrowDownToLine, Percent } from "lucide-react";

interface WithdrawalItem {
  id: string;
  reference: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface PharmacyWalletClientProps {
  initialBalance: number;
  initialRevenue: number;
  initialPending: number;
  initialPaidCount: number;
  initialMedicines: number;
  initialTransactions: any[];
  commissionRate: number;
}

const STATUS_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "danger", label: "Failed" },
};

export function PharmacyWalletClient({
  initialBalance,
  initialRevenue,
  initialPending,
  initialPaidCount,
  initialMedicines,
  initialTransactions,
  commissionRate,
}: PharmacyWalletClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });

  useEffect(() => {
    void loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await fetch("/api/pharmacy/wallet");
      const data = await res.json();
      if (data.ok) setWithdrawals(data.withdrawals || []);
    } catch {}
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError("Enter a valid amount"); return; }
    if (amount > balance) { setError("Insufficient balance"); return; }
    if (!form.bankName || !form.accountNumber || !form.accountName) { setError("All bank details are required"); return; }

    setWithdrawing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/pharmacy/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess("Withdrawal request submitted! It will be processed by admin.");
        setShowWithdrawModal(false);
        setForm({ amount: "", bankName: "", accountNumber: "", accountName: "" });
        void loadWithdrawals();
      } else {
        setError(data.error || "Failed to request withdrawal");
      }
    } catch {
      setError("Failed to request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const platformFee = Math.round(initialRevenue * commissionRate / 100);
  const netEarnings = initialRevenue - platformFee;

  return (
    <div className="space-y-6">
      {/* Wallet balance hero */}
      <Card className="bg-gradient-to-br from-navy/60 to-cyan/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan">Wallet balance</p>
              <p className="mt-1 text-4xl font-bold text-white">₦{balance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-white/60">Available for withdrawal</p>
            </div>
          </div>
          <Button variant="gold" onClick={() => setShowWithdrawModal(true)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Commission info */}
      <Card className="border border-cyan/20 bg-cyan/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Platform commission</p>
            <p className="text-sm text-white/80">
              Aetheris Health charges <span className="font-semibold text-white">{commissionRate}%</span> commission on each pharmacy order.
              Gross revenue: <span className="font-semibold text-white">₦{initialRevenue.toLocaleString()}</span> ·
              Platform fee: <span className="font-semibold text-gold">₦{platformFee.toLocaleString()}</span> ·
              Net earnings: <span className="font-semibold text-emerald-400">₦{netEarnings.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </Card>

      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
          <button className="ml-3 underline" onClick={() => setSuccess("")}>Dismiss</button>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Gross revenue</p>
              <p className="text-xl font-bold text-white">₦{initialRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pending</p>
              <p className="text-xl font-bold text-white">₦{initialPending.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Paid orders</p>
              <p className="text-xl font-bold text-white">{initialPaidCount}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Medicines</p>
              <p className="text-xl font-bold text-white">{initialMedicines}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal requests */}
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Withdrawal requests</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Your withdrawal history</h2>
        </div>
        {withdrawals.length === 0 ? (
          <p className="py-8 text-center text-white/60">No withdrawal requests yet. Click &ldquo;Withdraw&rdquo; to request a payout.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
              return (
                <div key={w.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                      <ArrowDownToLine className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">₦{w.amount.toLocaleString()}</p>
                      <p className="text-sm text-white/60">{new Date(w.createdAt).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="text-xs text-white/40">{w.description}</p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Transactions */}
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Transaction history</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Paid pharmacy orders</h2>
        </div>
        {initialTransactions.length === 0 ? (
          <p className="py-8 text-center text-white/60">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {initialTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">₦{tx.amount.toLocaleString()}</p>
                    <p className="text-sm text-white/60">{tx.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50">{new Date(tx.created_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <Badge variant={tx.delivery_status === "delivered" ? "success" : "cyan"}>{tx.delivery_status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdrawal modal */}
      <Modal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Request withdrawal">
        <form onSubmit={handleWithdraw} className="space-y-4">
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-3 text-sm text-white/70">
            Available balance: <span className="font-semibold text-cyan">₦{balance.toLocaleString()}</span>
          </div>
          <Input label="Amount (₦)" type="number" placeholder="e.g. 50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Bank name" placeholder="e.g. Access Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <Input label="Account number" placeholder="e.g. 0123456789" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <Input label="Account name" placeholder="e.g. City Gate Pharmacy" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          <p className="text-xs text-white/50">Withdrawal requests are reviewed by admin. Funds will be transferred within 1-2 business days.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={withdrawing}>{withdrawing ? "Processing…" : "Submit request"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
