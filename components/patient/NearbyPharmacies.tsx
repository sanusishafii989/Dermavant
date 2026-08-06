"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Star, Store } from "lucide-react";

interface PharmacyResult {
  _id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  status: string;
}

export function NearbyPharmacies() {
  const [pharmacies, setPharmacies] = useState<PharmacyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/partners");
        const data = await res.json();
        if (data.ok) {
          setPharmacies(data.partners || []);
        } else {
          setError(data.error || "Failed to load pharmacies");
        }
      } catch {
        setError("Failed to load pharmacies");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Find pharmacies</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Nearby Pharmacies</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Browse licensed pharmacy partners and order medicines.</p>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading pharmacies…</Card>
      ) : pharmacies.length === 0 ? (
        <Card className="p-6 text-[var(--text-secondary)]">No pharmacies found.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pharmacies.map((p) => (
            <Card key={p._id} hover className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{p.business_name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{p.owner_name}</p>
                  </div>
                </div>
                {p.status === "verified" ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.address || "Address not set"}</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4" /> {p.rating > 0 ? p.rating.toFixed(1) : "New"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-sm text-[var(--text-secondary)]">{p.phone}</span>
                <a href="/patient/pharmacy">
                  <Button variant="primary" size="sm">Browse medicines</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}