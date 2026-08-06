"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Navigation, Star } from "lucide-react";

interface DoctorResult {
  id: string;
  doctorId: string;
  specialization: string;
  consultation_fee: number;
  rating: number;
  hospital: string;
  experience: number;
  bio: string;
  status: string;
  available_today: boolean;
  user: { fullName: string; email: string; imageUrl?: string } | null;
}

export function NearbyDoctors() {
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [specialization, setSpecialization] = useState("");

  const loadDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL("/api/doctors", window.location.origin);
      if (specialization) url.searchParams.set("specialization", specialization);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.ok) {
        setDoctors(data.doctors || []);
      } else {
        setError(data.error || "Failed to load doctors");
      }
    } catch {
      setError("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Find doctors</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Nearby Doctors</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Browse licensed specialists and book consultations.</p>
          </div>
          <div className="flex gap-2">
            <input
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none"
              placeholder="Filter by specialization..."
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDoctors()}
            />
            <Button variant="primary" size="sm" onClick={loadDoctors} disabled={loading}>Search</Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading doctors…</Card>
      ) : doctors.length === 0 ? (
        <Card className="p-6 text-[var(--text-secondary)]">No doctors found. Try a different specialization.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {doctors.map((doc) => (
            <Card key={doc.id} hover className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{doc.user?.fullName || "Doctor"}</h3>
                  <p className="text-sm text-[var(--accent-cyan)]">{doc.specialization}</p>
                </div>
                {doc.available_today ? <Badge variant="success">Available today</Badge> : <Badge variant="default">Offline</Badge>}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {doc.hospital}</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4" /> {doc.rating > 0 ? doc.rating.toFixed(1) : "New"}</span>
                <span>{doc.experience} yrs exp</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{doc.bio}</p>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-lg font-bold text-[var(--text-primary)]">₦{doc.consultation_fee.toLocaleString()}</span>
                <a href={`/patient/dashboard/book-specialist?doctor=${doc.id}`}>
                  <Button variant="primary" size="sm">Book consultation</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}