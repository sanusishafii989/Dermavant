"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ClipboardList, Package, Truck, CheckCircle, XCircle, MapPin } from "lucide-react";

interface OrderItem {
  medicine_id: string;
  name: string;
  qty: number;
  unit_price: number;
}

interface PharmacyOrderItem {
  _id: string;
  order_id: string;
  patient_name: string;
  patient_email: string;
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
  refunded: { variant: "default", label: "Refunded" },
};

const STATUS_FLOW = ["pending", "processing", "shipped", "delivered"];

export function PharmacyOrders() {
  const [orders, setOrders] = useState<PharmacyOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ order: PharmacyOrderItem; status: string } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pharmacy/orders");
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || "Failed to load orders");
      }
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/pharmacy/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, delivery_status: status }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrders((prev) =>
          prev.map((o) => o._id === orderId ? { ...o, delivery_status: status } : o)
        );
      } else {
        setError(data.error || "Failed to update order");
      }
    } catch {
      setError("Failed to update order");
    } finally {
      setUpdatingId(null);
      setStatusModal(null);
    }
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => o.delivery_status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.delivery_status === "pending").length,
    processing: orders.filter((o) => o.delivery_status === "processing").length,
    shipped: orders.filter((o) => o.delivery_status === "shipped").length,
    delivered: orders.filter((o) => o.delivery_status === "delivered").length,
    cancelled: orders.filter((o) => o.delivery_status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Orders</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Manage pharmacy orders</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadOrders()}>Refresh</Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors capitalize ${
              filter === status
                ? "bg-[var(--accent-cyan)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/40 hover:text-[var(--text-primary)]"
            }`}
          >
            {status} <span className="ml-1 text-xs opacity-70">{counts[status as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading orders…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-[var(--text-secondary)]">No orders found.</Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const delCfg = DELIVERY_CONFIG[order.delivery_status] || DELIVERY_CONFIG.pending;
            const payCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.pending;
            const currentStep = STATUS_FLOW.indexOf(order.delivery_status);

            return (
              <Card key={order._id} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{order.patient_name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{order.patient_email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">
                        {new Date(order.created_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">
                        ₦{order.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-[var(--text-primary)]">{item.name} × {item.qty}</span>
                            <span className="text-[var(--text-secondary)]">₦{(item.unit_price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.delivery_address ? (
                      <p className="flex items-center gap-1 text-sm text-[var(--text-secondary)]"><MapPin className="h-3.5 w-3.5" /> {order.delivery_address}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={delCfg.variant}>Delivery: {delCfg.label}</Badge>
                      <Badge variant={payCfg.variant}>Payment: {payCfg.label}</Badge>
                    </div>
                  </div>

                  {["pending", "processing", "shipped"].includes(order.delivery_status) ? (
                    <div className="flex flex-col gap-2 md:w-44">
                      {order.delivery_status === "pending" && (
                        <Button size="sm" variant="primary" disabled={updatingId === order._id}
                          onClick={() => setStatusModal({ order, status: "processing" })}>
                          <Package className="mr-2 h-4 w-4" /> Start Processing
                        </Button>
                      )}
                      {order.delivery_status === "processing" && (
                        <Button size="sm" variant="primary" disabled={updatingId === order._id}
                          onClick={() => setStatusModal({ order, status: "shipped" })}>
                          <Truck className="mr-2 h-4 w-4" /> Mark Shipped
                        </Button>
                      )}
                      {order.delivery_status === "shipped" && (
                        <Button size="sm" variant="primary" disabled={updatingId === order._id}
                          onClick={() => setStatusModal({ order, status: "delivered" })}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={updatingId === order._id}
                        onClick={() => setStatusModal({ order, status: "cancelled" })}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Confirm status update">
        {statusModal ? (
          <div className="space-y-4">
            <p className="text-[var(--text-primary)]">
              Update order for <span className="font-semibold text-[var(--text-primary)]">{statusModal.order.patient_name}</span> to{" "}
              <span className="font-semibold text-[var(--accent-cyan)]">{DELIVERY_CONFIG[statusModal.status]?.label}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setStatusModal(null)}>Cancel</Button>
              <Button size="sm" disabled={updatingId === statusModal.order._id}
                onClick={() => updateStatus(statusModal.order._id, statusModal.status)}>
                {updatingId === statusModal.order._id ? "Updating…" : "Confirm"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
