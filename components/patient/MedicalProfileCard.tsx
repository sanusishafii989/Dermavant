"use client";

import { Activity, AlertTriangle, FileDown, Heart, Shield, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PatientVitalsSummary } from "@/types/history";

interface MedicalProfileCardProps {
  vitals?: PatientVitalsSummary | null;
  onExportPDF?: () => void;
}

export function MedicalProfileCard({ vitals, onExportPDF }: MedicalProfileCardProps) {
  if (!vitals) {
    return null;
  }

  return (
    <Card className="border border-cyan/20 bg-gradient-to-br from-cyan/10 via-navy/30 to-dark p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 p-2.5 text-[var(--accent-cyan)]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Patient Vitals & Health Profile</h2>
            <p className="text-xs text-[var(--text-secondary)]">Persistent clinical summary</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan" className="text-xs">
            Blood Group: {vitals.bloodGroup || "O+"}
          </Badge>
          {vitals.bloodPressure && (
            <Badge variant="gold" className="text-xs">
              BP: {vitals.bloodPressure}
            </Badge>
          )}
          {onExportPDF && (
            <Button variant="gold" size="sm" onClick={onExportPDF} className="flex items-center gap-1.5 text-xs ml-2">
              <FileDown className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">
            <Heart className="h-4 w-4" />
            <span>Biometrics</span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-[var(--text-primary)]">
            <p>Height: {vitals.height ? `${vitals.height} cm` : "Not specified"}</p>
            <p>Weight: {vitals.weight ? `${vitals.weight} kg` : "Not specified"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            <AlertTriangle className="h-4 w-4" />
            <span>Allergies</span>
          </div>
          <div className="mt-2 text-sm text-[var(--text-primary)]">
            {vitals.allergies && vitals.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {vitals.allergies.map((allergy, i) => (
                  <span key={i} className="rounded bg-[var(--accent-gold)]/10 px-2 py-0.5 text-xs text-[var(--accent-gold)]">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No known allergies</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">
            <Shield className="h-4 w-4" />
            <span>Chronic Conditions</span>
          </div>
          <div className="mt-2 text-sm text-[var(--text-primary)]">
            {vitals.chronicConditions && vitals.chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {vitals.chronicConditions.map((cond, i) => (
                  <span key={i} className="rounded bg-[var(--accent-cyan)]/10 px-2 py-0.5 text-xs text-[var(--accent-cyan)]">
                    {cond}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">None recorded</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <UserCheck className="h-4 w-4" />
            <span>Emergency Contact</span>
          </div>
          <div className="mt-2 text-sm text-[var(--text-primary)]">
            {vitals.emergencyContact ? (
              <div>
                <p className="font-medium text-[var(--text-primary)]">{vitals.emergencyContact.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{vitals.emergencyContact.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Not configured</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
