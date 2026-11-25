"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Clock, CheckCircle, ArrowDownToLine, Percent } from "lucide-react";

interface WithdrawalItem {
  id: string;
  reference: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  bankDetails?: any;
}

interface DoctorWalletClientProps {
  initialBalance: number;
  initialEarnings: number;
  initialPending: number;
  initialPaidCount: number;
  initialTransactions: any[];
  commissionRate: number;
}

const STATUS_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "danger", label: "Failed" },
};

export function DoctorWalletClient({
  initialBalance,
  initialEarnings,
  initialPending,
  initialPaidCount,
  initialTransactions,
  commissionRate,
}: DoctorWalletClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  useEffect(() => {
    void loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await fetch("/api/doctor/wallet");
      const data = await res.json();
      if (data.ok) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      // silent
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      setError("All bank details are required");
      return;
    }

    setWithdrawing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/doctor/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
        }),
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

  return (
    <div className="space-y-6">
      {/* Wallet balance hero */}
      <Card className="bg-gradient-to-br from-[var(--bg-secondary)]/60 to-[var(--accent-cyan)]/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Wallet balance</p>
              <p className="mt-1 text-4xl font-bold text-[var(--text-primary)]">₦{balance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Available for withdrawal</p>
            </div>
          </div>
          <Button variant="gold" onClick={() => setShowWithdrawModal(true)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Success message */}
      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
          <button className="ml-3 underline" onClick={() => setSuccess("")}>Dismiss</button>
        </div>
      ) : null}

      {/* Commission info */}
      <Card className="border border-[var(--accent-cyan)]/25 bg-[var(--accent-cyan)]/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Platform commission</p>
            <p className="text-sm text-[var(--text-primary)]">
              Dermavant charges <span className="font-semibold text-[var(--text-primary)]">{commissionRate}%</span> commission on each consultation.
              Gross earnings: <span className="font-semibold text-[var(--text-primary)]">₦{initialEarnings.toLocaleString()}</span> ·
              Platform fee: <span className="font-semibold text-[var(--accent-gold)]">₦{Math.round(initialEarnings * commissionRate / 100).toLocaleString()}</span> ·
              Net earnings: <span className="font-semibold text-emerald-400">₦{Math.round(initialEarnings * (100 - commissionRate) / 100).toLocaleString()}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Total earnings</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">₦{initialEarnings.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Pending</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">₦{initialPending.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Paid consultations</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{initialPaidCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal requests */}
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Withdrawal requests</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Your withdrawal history</h2>
        </div>

        {withdrawals.length === 0 ? (
          <p className="py-8 text-center text-[var(--text-secondary)]">No withdrawal requests yet. Click &ldquo;Withdraw&rdquo; to request a payout.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
              return (
                <div key={w.id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                      <ArrowDownToLine className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">₦{w.amount.toLocaleString()}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {new Date(w.createdAt).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{w.description}</p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Payment transactions */}
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Transaction history</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Recent payments</h2>
        </div>

        {initialTransactions.length === 0 ? (
          <p className="py-8 text-center text-[var(--text-secondary)]">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {initialTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">₦{tx.amount.toLocaleString()}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-muted)]">{tx.reference?.slice(0, 16) ?? "—"}{tx.reference && tx.reference.length > 16 ? "…" : ""}</span>
                  <Badge variant="success">{tx.channel}</Badge>
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

          <div className="rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-3 text-sm text-[var(--text-secondary)]">
            Available balance: <span className="font-semibold text-[var(--accent-cyan)]">₦{balance.toLocaleString()}</span>
          </div>

          <Input
            label="Amount (₦)"
            type="number"
            placeholder="e.g. 10000"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <Input
            label="Bank name"
            placeholder="e.g. Access Bank"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />

          <Input
            label="Account number"
            placeholder="e.g. 0123456789"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          />

          <Input
            label="Account name"
            placeholder="e.g. Dr. John Doe"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          />

          <p className="text-xs text-[var(--text-muted)]">
            Withdrawal requests are reviewed by admin. Funds will be transferred to your bank account within 1-2 business days.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={withdrawing}>
              {withdrawing ? "Processing…" : "Submit request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
