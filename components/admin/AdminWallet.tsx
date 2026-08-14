"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Wallet as WalletIcon, ArrowDownToLine, CheckCircle, XCircle, Users } from "lucide-react";

interface PendingWithdrawal {
  id: string;
  reference: string;
  amount: number;
  description: string;
  createdAt: string;
  approvalCount: number;
  requiredApprovals: number;
  approvals: { admin_name: string }[];
}

interface CompletedWithdrawal {
  id: string;
  reference: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export function AdminWallet() {
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [completed, setCompleted] = useState<CompletedWithdrawal[]>([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [requiredApprovals, setRequiredApprovals] = useState(2);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });

  const load = async () => {
    try {
      const res = await fetch("/api/admin/wallet");
      const data = await res.json();
      if (data.ok) {
        setBalance(data.wallet.balance);
        setPending(data.pendingWithdrawals || []);
        setCompleted(data.completedWithdrawals || []);
        setTotalAdmins(data.totalAdmins);
        setRequiredApprovals(data.requiredApprovals);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError("Invalid amount"); return; }
    if (amount > balance) { setError("Insufficient balance"); return; }
    if (!form.bankName || !form.accountNumber || !form.accountName) { setError("All fields required"); return; }

    setWithdrawing(true); setError("");
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(data.message);
        setShowWithdrawModal(false);
        setForm({ amount: "", bankName: "", accountNumber: "", accountName: "" });
        void load();
      } else { setError(data.error); }
    } catch { setError("Failed"); }
    setWithdrawing(false);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, action: "approve" }),
      });
      const data = await res.json();
      if (data.ok) { setSuccess(data.message); void load(); }
      else { setError(data.error); }
    } catch { setError("Failed"); }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, action: "reject" }),
      });
      const data = await res.json();
      if (data.ok) { setSuccess("Withdrawal rejected"); void load(); }
      else { setError(data.error); }
    } catch { setError("Failed"); }
  };

  if (loading) return <Card className="p-6 text-[var(--text-secondary)]">Loading wallet…</Card>;

  return (
    <div className="space-y-6">
      {/* Balance */}
      <Card className="bg-gradient-to-br from-[var(--bg-secondary)]/60 to-[var(--accent-cyan)]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]"><WalletIcon className="h-8 w-8" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Company Account Balance</p>
              <p className="mt-1 text-4xl font-bold text-[var(--text-primary)]">₦{balance.toLocaleString()}</p>
              <p className="text-sm text-[var(--text-muted)]">Platform revenue wallet</p>
            </div>
          </div>
          <Button variant="gold" onClick={() => setShowWithdrawModal(true)}><ArrowDownToLine className="mr-2 h-4 w-4" />Withdraw</Button>
        </div>
      </Card>

      {/* Info */}
      <Card className="border border-[var(--accent-cyan)]/20 bg-[var(--accent-cyan)]/5">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[var(--accent-cyan)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Withdrawals require <span className="font-bold text-[var(--text-primary)]">{requiredApprovals} of {totalAdmins}</span> admin approvals.
            Currently {pending.length} pending request{pending.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </Card>

      {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}<button className="ml-3 underline" onClick={() => setSuccess("")}>Dismiss</button></div> : null}
      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

      {/* Pending withdrawals */}
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Pending Withdrawals</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Awaiting Approval</h2>
        {pending.length === 0 ? <p className="mt-4 py-4 text-center text-[var(--text-muted)]">No pending withdrawals.</p> : (
          <div className="mt-4 space-y-3">
            {pending.map((w) => (
              <div key={w.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">₦{w.amount.toLocaleString()}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{w.description}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(w.createdAt).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="warning">{w.approvalCount}/{w.requiredApprovals} approved</Badge>
                      {w.approvals.map((a, i) => <Badge key={i} variant="success">{a.admin_name}</Badge>)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleApprove(w.id)}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(w.id)}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Completed */}
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Transaction History</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Completed Withdrawals</h2>
        {completed.length === 0 ? <p className="mt-4 py-4 text-center text-[var(--text-muted)]">No completed withdrawals.</p> : (
          <div className="mt-4 space-y-3">
            {completed.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">₦{w.amount.toLocaleString()}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{w.description}</p>
                </div>
                <Badge variant={w.status === "completed" ? "success" : "danger"}>{w.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdraw modal */}
      <Modal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Request withdrawal">
        <form onSubmit={handleWithdraw} className="space-y-4">
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <div className="rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-3 text-sm text-[var(--text-secondary)]">
            Available: <span className="font-semibold text-[var(--accent-cyan)]">₦{balance.toLocaleString()}</span>
          </div>
          <Input label="Amount (₦)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <Input label="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <Input label="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          <p className="text-xs text-[var(--text-muted)]">This withdrawal requires approval from {requiredApprovals - 1} other admin{requiredApprovals - 1 !== 1 ? "s" : ""}.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={withdrawing}>{withdrawing ? "Processing…" : "Submit"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
