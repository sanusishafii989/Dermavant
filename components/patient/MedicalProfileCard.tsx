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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan/30 bg-cyan/10 p-2.5 text-cyan">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Patient Vitals & Health Profile</h2>
            <p className="text-xs text-white/60">Persistent clinical summary</p>
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan">
            <Heart className="h-4 w-4" />
            <span>Biometrics</span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            <p>Height: {vitals.height ? `${vitals.height} cm` : "Not specified"}</p>
            <p>Weight: {vitals.weight ? `${vitals.weight} kg` : "Not specified"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            <AlertTriangle className="h-4 w-4" />
            <span>Allergies</span>
          </div>
          <div className="mt-2 text-sm text-white/80">
            {vitals.allergies && vitals.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {vitals.allergies.map((allergy, i) => (
                  <span key={i} className="rounded bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50">No known allergies</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan">
            <Shield className="h-4 w-4" />
            <span>Chronic Conditions</span>
          </div>
          <div className="mt-2 text-sm text-white/80">
            {vitals.chronicConditions && vitals.chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {vitals.chronicConditions.map((cond, i) => (
                  <span key={i} className="rounded bg-cyan/10 px-2 py-0.5 text-xs text-cyan">
                    {cond}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50">None recorded</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <UserCheck className="h-4 w-4" />
            <span>Emergency Contact</span>
          </div>
          <div className="mt-2 text-sm text-white/80">
            {vitals.emergencyContact ? (
              <div>
                <p className="font-medium text-white">{vitals.emergencyContact.name}</p>
                <p className="text-xs text-white/60">{vitals.emergencyContact.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-white/50">Not configured</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
