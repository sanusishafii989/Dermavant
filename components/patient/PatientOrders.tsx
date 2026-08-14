"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Store, Package, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface OrderItem {
  medicine_id: string;
  name: string;
  qty: number;
  unit_price: number;
}

interface PatientOrder {
  _id: string;
  order_id: string;
  pharmacy_name: string;
  items: OrderItem[];
  total: number;
  delivery_status: string;
  payment_status: string;
  delivery_address: string;
  created_at: string;
}

const DELIVERY_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  processing: { variant: "cyan", label: "Processing" },
  shipped: { variant: "cyan", label: "Shipped" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "danger", label: "Cancelled" },
};

const PAYMENT_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
};

export function PatientOrders() {
  const [orders, setOrders] = useState<PatientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/patient/orders");
        const data = await res.json();
        if (data.ok) setOrders(data.orders || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Card className="p-6 text-[var(--text-secondary)]">Loading your orders…</Card>;

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-[var(--accent-cyan)]/40" />
        <p className="mt-4 text-[var(--text-secondary)]">No orders yet. Browse the E-Pharmacy to place your first order.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Order History</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">My Orders</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Track your pharmacy orders and delivery status.</p>
        </div>
      </Card>

      <div className="space-y-4">
        {orders.map((order) => {
          const delCfg = DELIVERY_CONFIG[order.delivery_status] || DELIVERY_CONFIG.pending;
          const payCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.pending;
          const isExpanded = expandedId === order._id;

          return (
            <Card key={order._id} className="space-y-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{order.pharmacy_name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {new Date(order.created_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        {" at "}
                        {new Date(order.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={delCfg.variant}>Delivery: {delCfg.label}</Badge>
                    <Badge variant={payCfg.variant}>Payment: {payCfg.label}</Badge>
                    <Badge variant="default">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</Badge>
                  </div>

                  {isExpanded ? (
                    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-[var(--accent-cyan)]" />
                              <span className="text-[var(--text-primary)]">{item.name}</span>
                              <span className="text-[var(--text-muted)]">x{item.qty}</span>
                            </div>
                            <span className="text-[var(--text-secondary)]">₦{(item.unit_price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {order.delivery_address ? (
                        <p className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)]">
                          Delivery to: {order.delivery_address}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-xl font-bold text-[var(--text-primary)]">₦{order.total.toLocaleString()}</p>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    className="flex items-center gap-1 text-xs text-[var(--accent-cyan)] hover:underline"
                  >
                    {isExpanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> Details</>}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
