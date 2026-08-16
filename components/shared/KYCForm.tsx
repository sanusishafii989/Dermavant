"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle } from "lucide-react";

export function KYCForm({ role }: { role: "doctor" | "partner" }) {
  const [status, setStatus] = useState<string>("loading");
  const [reviewNotes, setReviewNotes] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const res = await fetch("/api/kyc");
      const data = await res.json();
      if (data.ok) {
        setStatus(data.application?.status || "none");
        setReviewNotes(data.application?.review_notes || "");
        if (data.application) {
          setForm({
            license_number: data.application.license_number || "",
            specialization: data.application.specialization || "",
            hospital: data.application.hospital || "",
            years_of_experience: String(data.application.years_of_experience || ""),
            medical_school: data.application.medical_school || "",
            business_name: data.application.business_name || "",
            business_registration_number: data.application.business_registration_number || "",
            pharmacist_license: data.application.pharmacist_license || "",
            phone_number: data.application.phone_number || "",
            address: data.application.address || "",
          });
        }
      } else {
        setStatus("none");
      }
    } catch {
      setStatus("none");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("pending");
      } else {
        setError(data.error || "Failed to submit KYC");
      }
    } catch {
      setError("Failed to submit KYC application");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; color: string }> = {
    loading: { icon: <Clock className="h-5 w-5" />, label: "Loading...", variant: "default", color: "text-[var(--text-secondary)]" },
    none: { icon: <ShieldCheck className="h-5 w-5" />, label: "Not Submitted", variant: "warning", color: "text-amber-500" },
    pending: { icon: <Clock className="h-5 w-5" />, label: "Under Review", variant: "cyan", color: "text-[var(--accent-cyan)]" },
    approved: { icon: <CheckCircle className="h-5 w-5" />, label: "Verified", variant: "success", color: "text-emerald-500" },
    rejected: { icon: <XCircle className="h-5 w-5" />, label: "Rejected", variant: "danger", color: "text-rose-500" },
  };

  const cfg = statusConfig[status] || statusConfig.none;

  const doctorFields: Array<{ key: string; label: string; required: boolean; type?: string }> = [
    { key: "license_number", label: "Medical License Number", required: true },
    { key: "specialization", label: "Specialization", required: true },
    { key: "hospital", label: "Hospital/Clinic Name", required: true },
    { key: "years_of_experience", label: "Years of Experience", type: "number", required: true },
    { key: "medical_school", label: "Medical School", required: false },
  ];

  const pharmacyFields: Array<{ key: string; label: string; required: boolean; type?: string }> = [
    { key: "business_name", label: "Business Name", required: true },
    { key: "business_registration_number", label: "Business Registration Number (CAC)", required: true },
    { key: "pharmacist_license", label: "Pharmacist License Number", required: true },
  ];

  const sharedFields: Array<{ key: string; label: string; required: boolean; type?: string }> = [
    { key: "phone_number", label: "Phone Number", required: true },
    { key: "address", label: "Practice/Business Address", required: true },
  ];

  const fields = role === "doctor" ? [...doctorFields, ...sharedFields] : [...pharmacyFields, ...sharedFields];

  // If approved or pending, show status card
  if (status === "approved" || status === "pending") {
    return (
      <Card className="max-w-3xl">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cfg.color} bg-[var(--bg-card)]`}>
            {cfg.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">KYC Verification</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {status === "approved"
                ? "Your account has been verified. You have full access to all features."
                : "Your application is under review by our admin team. This typically takes 1-2 business days."}
            </p>
            {reviewNotes ? (
              <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-secondary)]">
                Admin notes: {reviewNotes}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Verification</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">KYC Application</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {role === "doctor"
                ? "Submit your professional credentials for verification. Required before you can accept consultations."
                : "Submit your business credentials for verification. Required before you can list medicines."}
            </p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>

        {status === "rejected" ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            Your previous application was rejected. {reviewNotes ? `Reason: ${reviewNotes}` : "Please review and resubmit."}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type || "text"}
              required={field.required}
              value={form[field.key] || ""}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.label}
            />
          ))}
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-[var(--text-secondary)]">
          Note: Document upload (ID, license certificate) will be available in a future update. For now, please ensure all license and registration numbers are accurate — admin will verify them.
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for verification"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
