"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface MedicineItem {
  _id: string;
  medicine_id?: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
  status?: string;
}

export function PharmacyCatalogue() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/medicines", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load medicines.");
      }

      setMedicines(Array.isArray(data?.medicines) ? data.medicines : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load medicines.");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines();
  }, []);

  const totalInventory = useMemo(
    () => medicines.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [medicines]
  );

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-white/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Partner catalogue</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your medicines</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              These medicines are pulled directly from your pharmacy catalogue and reflect the partner-linked records in MongoDB.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Inventory</div>
              <div className="mt-1 text-xl font-semibold text-white">{totalInventory}</div>
            </div>
            <Button onClick={() => void loadMedicines()} variant="secondary">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="border border-white/10 bg-white/5 p-6 text-white/70">Loading medicines…</Card>
      ) : error ? (
        <Card className="border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">{error}</Card>
      ) : medicines.length === 0 ? (
        <Card className="border border-white/10 bg-white/5 p-6 text-white/70">
          No medicines are currently linked to this partner account.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {medicines.map((medicine) => (
            <Card key={medicine._id} className="border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{medicine.name}</h2>
                  <p className="mt-1 text-sm text-cyan">{medicine.brand || "General brand"}</p>
                </div>
                <div className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan">
                  {medicine.status || "active"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">{medicine.category || "General"}</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">Qty: {medicine.quantity}</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">₦{medicine.price.toLocaleString()}</span>
              </div>

              {medicine.description ? <p className="mt-4 text-sm text-white/70">{medicine.description}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
