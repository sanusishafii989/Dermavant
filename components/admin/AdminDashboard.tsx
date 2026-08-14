"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Stethoscope, Store, Shield, Calendar, Package, Brain, Headphones, TrendingUp, DollarSign, Activity, Wallet } from "lucide-react";

interface Stats {
  users: { patients: number; doctors: number; partners: number; admins: number; total: number; suspended: number; };
  verifications: { pendingDoctors: number; pendingPartners: number; totalPending: number; };
  operations: { appointments: number; pharmacyOrders: number; aiReports: number; openTickets: number; };
  financials: { totalVolume: number; recentTransactions: any[]; };
}

interface Revenue {
  adminWalletBalance: number;
  totals: {
    platformRevenue: number;
    consultationVolume: number;
    pharmacyOrderVolume: number;
    topupVolume: number;
    withdrawalVolume: number;
  };
  transactions: any[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, revRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/revenue"),
        ]);
        const statsData = await statsRes.json();
        const revData = await revRes.json();
        if (statsData.ok) setStats(statsData.stats);
        if (revData.ok) setRevenue(revData.revenue);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Card className="p-6 text-[var(--text-secondary)]">Loading dashboard…</Card>;

  return (
    <div className="space-y-6">
      {/* Revenue overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Platform Revenue</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">₦{(revenue?.totals.platformRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Total Volume</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">₦{((revenue?.totals.consultationVolume || 0) + (revenue?.totals.pharmacyOrderVolume || 0)).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"><Wallet className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Wallet Balance</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">₦{(revenue?.adminWalletBalance || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Open Tickets</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats?.operations.openTickets || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="flex items-center gap-3"><Users className="h-8 w-8 text-[var(--accent-cyan)]" /><div><p className="text-xs text-[var(--text-muted)]">Patients</p><p className="text-xl font-bold text-[var(--text-primary)]">{stats?.users.patients || 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><Stethoscope className="h-8 w-8 text-[var(--accent-gold)]" /><div><p className="text-xs text-[var(--text-muted)]">Doctors</p><p className="text-xl font-bold text-[var(--text-primary)]">{stats?.users.doctors || 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><Store className="h-8 w-8 text-[var(--accent-cyan)]" /><div><p className="text-xs text-[var(--text-muted)]">Pharmacies</p><p className="text-xl font-bold text-[var(--text-primary)]">{stats?.users.partners || 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><Shield className="h-8 w-8 text-[var(--accent-gold)]" /><div><p className="text-xs text-[var(--text-muted)]">Admins</p><p className="text-xl font-bold text-[var(--text-primary)]">{stats?.users.admins || 0}</p></div></div></Card>
      </div>

      {/* Revenue breakdown + Operations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Revenue Breakdown</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Transaction Volumes</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
              <span className="text-sm text-[var(--text-secondary)]">Consultation Volume</span>
              <span className="font-bold text-[var(--text-primary)]">₦{(revenue?.totals.consultationVolume || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
              <span className="text-sm text-[var(--text-secondary)]">Pharmacy Order Volume</span>
              <span className="font-bold text-[var(--text-primary)]">₦{(revenue?.totals.pharmacyOrderVolume || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
              <span className="text-sm text-[var(--text-secondary)]">Top-up Volume</span>
              <span className="font-bold text-[var(--text-primary)]">₦{(revenue?.totals.topupVolume || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-3">
              <span className="text-sm font-medium text-[var(--accent-cyan)]">Platform Revenue (Commission)</span>
              <span className="font-bold text-[var(--accent-cyan)]">₦{(revenue?.totals.platformRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Platform Activity</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Operations Overview</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-4 text-center">
              <Calendar className="mx-auto h-6 w-6 text-[var(--accent-cyan)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stats?.operations.appointments || 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Appointments</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-4 text-center">
              <Package className="mx-auto h-6 w-6 text-[var(--accent-gold)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stats?.operations.pharmacyOrders || 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Pharmacy Orders</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-4 text-center">
              <Brain className="mx-auto h-6 w-6 text-[var(--accent-cyan)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stats?.operations.aiReports || 0}</p>
              <p className="text-xs text-[var(--text-muted)]">AI Reports</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-4 text-center">
              <Headphones className="mx-auto h-6 w-6 text-[var(--accent-gold)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stats?.operations.openTickets || 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Open Tickets</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Recent Activity</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Latest Transactions</h2>
        <div className="mt-4 space-y-3">
          {revenue?.transactions?.length ? revenue.transactions.slice(0, 10).map((tx) => (
            <div key={tx._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"><Activity className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{tx.type || tx.purpose || "Transaction"}</p>
                  <p className="text-xs text-[var(--text-muted)]">{tx.reference?.slice(0, 20)}…</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-primary)]">₦{(tx.amount || 0).toLocaleString()}</p>
                <Badge variant={tx.status === "success" || tx.status === "completed" ? "success" : "warning"}>{tx.status}</Badge>
              </div>
            </div>
          )) : <p className="py-4 text-center text-[var(--text-muted)]">No transactions yet.</p>}
        </div>
      </Card>
    </div>
  );
}
