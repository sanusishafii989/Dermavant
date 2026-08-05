"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LocationEditor } from "@/components/location/DynamicLocationEditor";

interface DoctorProfileData {
  _id?: string;
  doctor_id?: string;
  specialization: string;
  hospital: string;
  address: string;
  consultation_fee: number;
  bio: string;
  experience: number;
  available_today: boolean;
  license_number: string;
  status: string;
  rating: number;
  latitude: number;
  longitude: number;
}

export function DoctorProfileForm() {
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/doctor/profile");
        const data = await res.json();
        if (data.ok) {
          setProfile(data.profile);
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialization: profile.specialization,
          hospital: profile.hospital,
          address: profile.address,
          consultation_fee: profile.consultation_fee,
          bio: profile.bio,
          experience: profile.experience,
          available_today: profile.available_today,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to save profile");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-white/70">Loading profile…</Card>
    );
  }

  if (error && !profile) {
    return (
      <Card className="border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">{error}</Card>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Professional info */}
      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan">Professional information</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Edit your details</h2>
            </div>
            <div className="flex items-center gap-2">
              {profile.status === "verified" ? (
                <Badge variant="success">Verified</Badge>
              ) : profile.status === "pending" ? (
                <Badge variant="warning">Pending verification</Badge>
              ) : (
                <Badge variant="danger">{profile.status}</Badge>
              )}
              {profile.available_today ? (
                <Badge variant="cyan">Available today</Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Specialization"
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              placeholder="e.g. Dermatology"
            />
            <Input
              label="Hospital / Clinic"
              value={profile.hospital}
              onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
              placeholder="e.g. Aetheris Medical Centre"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Consultation fee (₦)"
              type="number"
              value={profile.consultation_fee}
              onChange={(e) => setProfile({ ...profile, consultation_fee: Number(e.target.value) })}
            />
            <Input
              label="Years of experience"
              type="number"
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Bio</label>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 transition-colors focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Brief professional biography for patients to see"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Available today</p>
              <p className="text-sm text-white/60">Toggle to show patients you are available for bookings today</p>
            </div>
            <button
              type="button"
              onClick={() => setProfile({ ...profile, available_today: !profile.available_today })}
              className={`relative h-7 w-14 rounded-full transition-colors ${profile.available_today ? "bg-cyan" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${profile.available_today ? "left-8" : "left-1"}`}
              />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="License number" value={profile.license_number} readOnly />
            <Input label="Rating" value={profile.rating > 0 ? `${profile.rating.toFixed(1)} / 5.0` : "No ratings yet"} readOnly />
          </div>

          {error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : null}

          {success ? (
            <p className="text-sm text-emerald-400">Profile saved successfully</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Location editor */}
      <LocationEditor
        endpoint="/api/doctor/location"
        title="Practice location"
        description="Set your clinic or hospital location so patients can find you on the map."
        initialAddress={profile.address}
        initialLatitude={profile.latitude || 6.5244}
        initialLongitude={profile.longitude || 3.3792}
      />
    </div>
  );
}
