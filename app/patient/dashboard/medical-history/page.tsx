"use client";

import { useEffect, useState } from "react";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { MedicalHistoryTimeline } from "@/components/patient/MedicalHistoryTimeline";
import { MedicalProfileCard } from "@/components/patient/MedicalProfileCard";
import { Card } from "@/components/ui/Card";
import { patientNavLinks } from "@/lib/portal-nav";
import type { MedicalHistoryItem, PatientVitalsSummary } from "@/types/history";
import { useUser } from "@clerk/nextjs";
import { FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateMedicalHistoryPDF } from "@/lib/pdf-export";

export default function MedicalHistoryPage() {
  const { user } = useUser();
  const [items, setItems] = useState<MedicalHistoryItem[]>([]);
  const [vitals, setVitals] = useState<PatientVitalsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/patient/medical-history");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch medical history");
      }

      setItems(data.items || []);
      setVitals(data.vitals || null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const patientName =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Dermavant Patient";

      generateMedicalHistoryPDF({
        patientName,
        vitals,
        items,
      });
    } catch (err: any) {
      console.error("[PDF EXPORT] Error:", err);
      setError("Failed to generate PDF export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PortalDashboardShell title="Continuous Medical History Archive" links={patientNavLinks}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Medical History & Vitals</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Aggregated timeline of AI triages, doctor consultations, prescriptions, and health vitals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <Button
              variant="gold"
              onClick={handleExportPDF}
              disabled={isExporting || loading}
              className="flex items-center gap-2 text-xs shadow-md"
            >
              <FileDown className="h-4 w-4" />
              <span>{isExporting ? "Generating PDF..." : "Export PDF"}</span>
            </Button>
            <Button variant="secondary" onClick={fetchHistory} className="flex items-center gap-2 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </Card>
        )}

        {loading ? (
          <Card className="p-12 text-center text-[var(--text-secondary)]">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[var(--accent-cyan)]" />
            <p className="mt-3 text-sm font-medium">Loading clinical record timeline...</p>
          </Card>
        ) : (
          <>
            {/* Vitals Summary Card */}
            <MedicalProfileCard vitals={vitals} onExportPDF={handleExportPDF} />

            {/* History Timeline */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Clinical Care Timeline</h2>
              <MedicalHistoryTimeline items={items} />
            </div>
          </>
        )}
      </div>
    </PortalDashboardShell>
  );
}
