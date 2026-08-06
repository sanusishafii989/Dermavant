"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  HeartPulse,
  AlertTriangle,
  Stethoscope,
  PhoneCall,
  Plus,
  X,
  CheckCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

export interface PatientProfileData {
  _id?: string;
  patient_id?: string;
  fullName: string;
  email: string;
  phone: string;
  blood_group: string;
  height: number;
  weight: number;
  blood_pressure: string;
  primary_physician: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  past_surgeries: string[];
  emergency_contact: {
    name: string;
    phone: string;
  };
}

export function PatientProfileForm() {
  const [profile, setProfile] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Tag inputs state
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [surgeryInput, setSurgeryInput] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/patient/profile");
        const data = await res.json();
        if (data.ok) {
          setProfile(data.profile);
        } else {
          setError(data.error || "Failed to load patient profile");
        }
      } catch {
        setError("Failed to load patient profile");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to save profile");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (
    field: "allergies" | "chronic_conditions" | "current_medications" | "past_surgeries",
    val: string,
    clearInput: () => void
  ) => {
    if (!val.trim() || !profile) return;
    if (!profile[field].includes(val.trim())) {
      setProfile({
        ...profile,
        [field]: [...profile[field], val.trim()],
      });
    }
    clearInput();
  };

  const removeTag = (
    field: "allergies" | "chronic_conditions" | "current_medications" | "past_surgeries",
    index: number
  ) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [field]: profile[field].filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <Card className="p-12 text-center text-white/60">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan mb-3" />
        Loading patient medical profile...
      </Card>
    );
  }

  if (error && !profile) {
    return (
      <Card className="border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
        {error}
      </Card>
    );
  }

  if (!profile) return null;

  const heightMeters = profile.height / 100;
  const bmi =
    heightMeters > 0 && profile.weight > 0
      ? (profile.weight / (heightMeters * heightMeters)).toFixed(1)
      : null;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Basic Personal Info */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Personal Information</h2>
              <p className="text-xs text-white/60">Core identity and contact details</p>
            </div>
          </div>
          <Badge variant="cyan">Patient ID: {profile.patient_id?.slice(-6) || "N/A"}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            label="Phone Number"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="+234 801 234 5678"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email Address" value={profile.email} readOnly disabled className="opacity-70" />
          <Input
            label="Primary Physician"
            value={profile.primary_physician}
            onChange={(e) => setProfile({ ...profile, primary_physician: e.target.value })}
            placeholder="Dr. Sarah Jenkins"
          />
        </div>
      </Card>

      {/* Vitals & Clinical Metrics */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Vitals & Clinical Metrics</h2>
            <p className="text-xs text-white/60">Biometric statistics and vitals summary</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Blood Group</label>
            <select
              value={profile.blood_group}
              onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-dark/80 px-3.5 py-2.5 text-sm text-white focus:border-cyan focus:outline-none"
            >
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Height (cm)"
            type="number"
            value={profile.height}
            onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
          />

          <Input
            label="Weight (kg)"
            type="number"
            value={profile.weight}
            onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
          />

          <Input
            label="Blood Pressure"
            value={profile.blood_pressure}
            onChange={(e) => setProfile({ ...profile, blood_pressure: e.target.value })}
            placeholder="120/80 mmHg"
          />
        </div>

        {bmi && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white/80">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan" /> Computed Body Mass Index (BMI):
            </span>
            <span className="font-mono font-bold text-cyan text-sm">{bmi} kg/m²</span>
          </div>
        )}
      </Card>

      {/* Medical Profile & Conditions */}
      <Card className="space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Medical Conditions & Medications</h2>
            <p className="text-xs text-white/60">Known allergies, ongoing treatments, and surgical history</p>
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-rose-400">
            Known Allergies
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Penicillin, Peanuts"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("allergies", allergyInput, () => setAllergyInput(""));
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addTag("allergies", allergyInput, () => setAllergyInput(""))}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.allergies.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-200"
              >
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("allergies", idx)}
                  className="hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {profile.allergies.length === 0 && (
              <p className="text-xs text-white/40 italic">No allergies listed.</p>
            )}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gold">
            Chronic Conditions
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Asthma, Hypertension"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("chronic_conditions", conditionInput, () => setConditionInput(""));
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addTag("chronic_conditions", conditionInput, () => setConditionInput(""))}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.chronic_conditions.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/15 px-3 py-1 text-xs font-medium text-gold"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("chronic_conditions", idx)}
                  className="hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {profile.chronic_conditions.length === 0 && (
              <p className="text-xs text-white/40 italic">No chronic conditions listed.</p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-cyan">
            Current Medications
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Lisinopril 10mg daily"
              value={medicationInput}
              onChange={(e) => setMedicationInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("current_medications", medicationInput, () => setMedicationInput(""));
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addTag("current_medications", medicationInput, () => setMedicationInput(""))}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.current_medications.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/15 px-3 py-1 text-xs font-medium text-cyan"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("current_medications", idx)}
                  className="hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {profile.current_medications.length === 0 && (
              <p className="text-xs text-white/40 italic">No current medications listed.</p>
            )}
          </div>
        </div>

        {/* Past Surgeries */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-400">
            Past Surgeries & Procedures
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Appendectomy 2021"
              value={surgeryInput}
              onChange={(e) => setSurgeryInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("past_surgeries", surgeryInput, () => setSurgeryInput(""));
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addTag("past_surgeries", surgeryInput, () => setSurgeryInput(""))}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.past_surgeries.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-200"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("past_surgeries", idx)}
                  className="hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {profile.past_surgeries.length === 0 && (
              <p className="text-xs text-white/40 italic">No past surgeries listed.</p>
            )}
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="space-y-4 border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Emergency Contact</h2>
            <p className="text-xs text-rose-200/70">Designated person to reach during clinical emergencies</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact Full Name"
            value={profile.emergency_contact.name}
            onChange={(e) =>
              setProfile({
                ...profile,
                emergency_contact: { ...profile.emergency_contact, name: e.target.value },
              })
            }
            placeholder="Jane Doe (Spouse / Parent)"
          />
          <Input
            label="Contact Phone Number"
            value={profile.emergency_contact.phone}
            onChange={(e) =>
              setProfile({
                ...profile,
                emergency_contact: { ...profile.emergency_contact, phone: e.target.value },
              })
            }
            placeholder="+234 802 345 6789"
          />
        </div>
      </Card>

      {/* Feedback Messages & Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div>
          {error ? <p className="text-sm font-medium text-rose-400">{error}</p> : null}
          {success ? (
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> Patient medical profile updated successfully!
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto px-8 bg-cyan text-dark font-bold hover:bg-cyan/90">
          {saving ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Saving Changes...
            </span>
          ) : (
            "Save Medical Profile"
          )}
        </Button>
      </div>
    </form>
  );
}
