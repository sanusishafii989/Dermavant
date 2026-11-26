"use client";

import { useUser } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
type DocumentKind = "license" | "business" | "identity";
const DOCUMENT_FIELDS: Record<DocumentKind, string> = {
  license: "license_document_url",
  business: "business_document_url",
  identity: "id_document_url",
};

function documentHref(pathname: string) {
  return `/api/kyc/documents?pathname=${encodeURIComponent(pathname)}`;
}

export function KYCForm({ role }: { role: "doctor" | "partner" }) {
  const { user } = useUser();
  const [status, setStatus] = useState<string>("loading");
  const [reviewNotes, setReviewNotes] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<DocumentKind | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const res = await fetch("/api/kyc", { cache: "no-store" });
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
            license_document_url: data.application.license_document_url || "",
            business_document_url: data.application.business_document_url || "",
            id_document_url: data.application.id_document_url || "",
          });
        }
      } else {
        setStatus("none");
      }
    } catch {
      setStatus("none");
    }
  };

  const uploadDocument = async (kind: DocumentKind, file: File) => {
    setError("");
    if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
      setError("Choose a non-empty document up to 5 MB.");
      return;
    }
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      setError("Use a PDF, JPG, or PNG document.");
      return;
    }
    if (!user?.id) {
      setError("Please sign in again before uploading.");
      return;
    }

    setUploading(kind);
    try {
      const pathname = `kyc/${user.id}/${kind}/current`;
      const blob = await upload(pathname, file, {
        access: "private",
        contentType: file.type,
        handleUploadUrl: "/api/kyc/documents",
        clientPayload: JSON.stringify({ role, kind }),
      });
      setForm((current) => ({ ...current, [DOCUMENT_FIELDS[kind]]: blob.pathname }));
    } catch {
      setError("The secure upload failed. Check that the private document store is connected, then try again.");
    } finally {
      setUploading(null);
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
    loading: { icon: <Clock className="h-5 w-5" />, label: "Loading...", variant: "default", color: "text-secondary" },
    none: { icon: <ShieldCheck className="h-5 w-5" />, label: "Not Submitted", variant: "warning", color: "text-amber-500" },
    pending: { icon: <Clock className="h-5 w-5" />, label: "Under Review", variant: "cyan", color: "text-accent-cyan" },
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
  const hasRequiredDocuments = Boolean(form.license_document_url) &&
    (role !== "partner" || Boolean(form.business_document_url));

  const uploadField = (kind: DocumentKind, label: string, required: boolean) => {
    const path = form[DOCUMENT_FIELDS[kind]];
    return (
      <div key={kind} className="rounded-2xl border border-border bg-surface p-4">
        <label className="block text-sm font-medium text-primary">
          {label}{required ? " *" : " (optional)"}
          <span className="mt-1 block text-xs font-normal text-secondary">PDF, JPG, or PNG · max 5 MB</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            disabled={uploading !== null || submitting}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void uploadDocument(kind, file);
            }}
            className="mt-3 block w-full text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent-cyan/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-cyan"
          />
        </label>
        {uploading === kind ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-secondary"><Upload className="h-4 w-4 animate-pulse" /> Uploading privately…</p>
        ) : path ? (
          <a className="mt-3 inline-flex items-center gap-2 text-sm text-accent-cyan hover:underline" href={documentHref(path)} target="_blank" rel="noreferrer">
            <FileText className="h-4 w-4" /> View uploaded document
          </a>
        ) : (
          <p className="mt-3 text-xs text-secondary">No document uploaded yet.</p>
        )}
      </div>
    );
  };

  if (status === "approved" || (status === "pending" && hasRequiredDocuments)) {
    return (
      <Card className="max-w-3xl">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cfg.color} bg-surface`}>
            {cfg.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-primary">KYC Verification</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-secondary">
              {status === "approved"
                ? "Your account has been verified. You have full access to all features."
                : "Your application and documents are under review by the admin team."}
            </p>
            {form.license_document_url ? (
              <a className="mt-3 inline-flex items-center gap-2 text-sm text-accent-cyan hover:underline" href={documentHref(form.license_document_url)} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" /> View license document
              </a>
            ) : null}
            {form.business_document_url ? (
              <a className="mt-2 flex items-center gap-2 text-sm text-accent-cyan hover:underline" href={documentHref(form.business_document_url)} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" /> View business registration document
              </a>
            ) : null}
            {reviewNotes ? (
              <p className="mt-2 rounded-xl border border-border bg-surface p-3 text-sm text-secondary">
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
            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Verification</p>
            <h2 className="mt-1 text-xl font-semibold text-primary">KYC Application</h2>
            <p className="mt-1 text-sm text-secondary">
              {role === "doctor"
                ? "Submit your professional credentials for verification."
                : "Submit your pharmacy business and pharmacist credentials for verification."}
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

        <div className="grid gap-4 sm:grid-cols-2">
          {uploadField("license", role === "doctor" ? "Medical license" : "Pharmacist license", true)}
          {role === "partner" ? uploadField("business", "Business registration certificate", true) : null}
          {uploadField("identity", "Identity document", false)}
        </div>

        <p className="rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-3 text-xs text-secondary">
          Files are stored privately. Only the account owner and authorized admins can download them. Upload genuine documents only.
        </p>

        {error ? <p className="text-sm text-rose-400" role="alert">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || uploading !== null || !hasRequiredDocuments}>
            {submitting ? "Submitting..." : "Submit for verification"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
