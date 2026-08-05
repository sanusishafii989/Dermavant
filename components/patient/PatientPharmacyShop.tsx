"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export type MedicineItem = {
  _id: string;
  medicine_id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  partner_id: string;
  partner_name?: string;
  status: string;
  qr_code: string;
};

export default function PatientPharmacyShop() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/medicines/search", window.location.origin);
        if (query) url.searchParams.set("q", query);
        const response = await fetch(url.toString());
        const data = await response.json();
        if (response.ok && data.ok) {
          setItems(data.medicines || []);
        } else {
          setError(data.error || "Unable to load medicines.");
        }
      } catch (error) {
        setError("Unable to load medicines.");
      } finally {
        setLoading(false);
      }
    };

    void fetchItems();
  }, [query]);

  const cartItems = useMemo(
    () =>
      items
        .filter((item) => cart[item.medicine_id] > 0)
        .map((item) => ({
          item,
          qty: cart[item.medicine_id],
          subtotal: item.price * cart[item.medicine_id],
        })),
    [cart, items]
  );

  const total = cartItems.reduce((sum, entry) => sum + entry.subtotal, 0);

  const addToCart = (itemId: string) => {
    setCart((current) => ({
      ...current,
      [itemId]: (current[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((current) => {
      const next = { ...current };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      setError("Add at least one item to the cart before checkout.");
      return;
    }

    setCheckoutLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payment/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "pharmacy_order",
          items: cartItems.map((entry) => ({
            medicineId: entry.item._id,
            name: entry.item.name,
            qty: entry.qty,
            unitPrice: entry.item.price,
            partnerId: entry.item.partner_id,
            partnerName: entry.item.partner_name,
          })),
          total: total,
          deliveryAddress: "Default delivery address",
          partnerId: cartItems[0]?.item.partner_id,
          callbackUrl: `${window.location.origin}/patient/dashboard/payment/success`,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Unable to initialize payment.");
        return;
      }

      window.location.href = payload.authorization_url;
    } catch (error: any) {
      setError(error?.message || "Unable to initialize payment.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">E-Pharmacy</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--text-primary)]">Browse medicines</h1>
          </div>
          <div className="max-w-xl sm:flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search medicines, brands, or categories"
            />
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {loading ? (
            <Card className="p-6 text-[var(--text-secondary)]">Loading medicines…</Card>
          ) : items.length === 0 ? (
            <Card className="p-6 text-[var(--text-secondary)]">No medicines match your search.</Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <Card key={item._id} className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Image
                      src={item.image && item.image !== "/placeholder-pill.png" ? item.image : "/placeholder-pill.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-2xl object-cover"
                      unoptimized
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span>{item.brand}</span>
                        <span>·</span>
                        <span>{item.category}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{item.name}</h2>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">Stock: {item.quantity > 0 ? item.quantity : "Out of stock"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-[var(--text-primary)]">₦{item.price.toLocaleString()}</span>
                    <Button
                      disabled={item.quantity === 0}
                      onClick={() => addToCart(item.medicine_id)}
                    >
                      Add to cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Cart</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Your order</h2>
          </div>
          {cartItems.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Add medicines to your cart to start checkout.</p>
          ) : (
            <div className="space-y-3">
              {cartItems.map((entry) => (
                <div key={entry.item.medicine_id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{entry.item.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Qty: {entry.qty}</p>
                    </div>
                    <div className="text-right text-[var(--text-secondary)]">
                      <p>₦{entry.subtotal.toLocaleString()}</p>
                      <button className="text-sm text-[var(--accent-cyan)] hover:underline" onClick={() => removeFromCart(entry.item.medicine_id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>
              <Button onClick={checkout} disabled={checkoutLoading}>
                {checkoutLoading ? "Starting payment…" : "Checkout with Paystack"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
