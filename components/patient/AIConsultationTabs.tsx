"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AIConsultationWizard } from "@/components/patient/AIConsultationWizard";
import { Brain, History, ChevronRight, AlertCircle } from "lucide-react";

interface AIConsultationTabsProps {
  aiProvider: "gemini" | "groq";
}

interface AIReport {
  _id: string;
  report_id: string;
  symptoms_text: string;
  diagnosis: Array<{
    condition: string;
    confidence: number;
    reasoning: string;
  }>;
  confidence_score: number;
  recommendation: string;
  follow_up_guidance: string;
  needs_immediate_professional_care: boolean;
  generated_at: string;
}

export function AIConsultationTabs({ aiProvider }: AIConsultationTabsProps) {
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  useEffect(() => {
    if (activeTab === "history") void loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/patient/medical-history");
      const data = await res.json();
      if (data.ok && data.items) {
        const aiReports = data.items.filter((item: any) => item.category === "ai_triage");
        setReports(aiReports);
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "new"
              ? "bg-[var(--accent-cyan)] text-white"
              : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Brain className="h-4 w-4" />
          New Consultation
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-[var(--accent-cyan)] text-white"
              : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <History className="h-4 w-4" />
          History
          {reports.length > 0 ? (
            <span className="rounded-full bg-[var(--accent-cyan)]/20 px-2 py-0.5 text-xs text-[var(--accent-cyan)]">
              {reports.length}
            </span>
          ) : null}
        </button>
      </div>

      {/* New consultation tab */}
      {activeTab === "new" ? (
        <AIConsultationWizard aiProvider={aiProvider} />
      ) : (
        /* History tab */
        <div className="space-y-4">
          {loadingHistory ? (
            <Card className="p-6 text-[var(--text-secondary)]">Loading AI consultation history...</Card>
          ) : reports.length === 0 ? (
            <Card className="p-6 text-center text-[var(--text-secondary)]">
              <Brain className="mx-auto h-12 w-12 text-[var(--accent-cyan)]/40" />
              <p className="mt-3">No AI consultations yet. Start a new consultation to see your history here.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setActiveTab("new")}>
                Start new consultation
              </Button>
            </Card>
          ) : selectedReport ? (
            /* Detailed report view */
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">AI Triage Report</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                    {new Date(selectedReport.generated_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>Back to list</Button>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Symptoms described</p>
                <p className="mt-2 text-sm text-[var(--text-primary)]">{selectedReport.symptoms_text}</p>
              </div>

              {selectedReport.diagnosis?.map((d, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-[var(--text-primary)]">{d.condition}</p>
                    <Badge variant="cyan">AI estimate: {(d.confidence * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{d.reasoning}</p>
                </div>
              ))}

              <p className="text-xs text-[var(--text-muted)]">
                AI estimates are model-generated and are not validated diagnostic probabilities.
              </p>

              {selectedReport.recommendation ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Recommendation</p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">{selectedReport.recommendation}</p>
                </div>
              ) : null}

              {selectedReport.needs_immediate_professional_care ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This report flagged that immediate professional care may be needed. Please consult a licensed doctor.
                  </p>
                </div>
              ) : null}
            </Card>
          ) : (
            /* Report list */
            reports.map((report) => (
              <Card key={report._id} hover className="space-y-2 cursor-pointer" onClick={() => setSelectedReport(report)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">AI Dermatology Triage</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{report.symptoms_text}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={report.needs_immediate_professional_care ? "warning" : "success"}>
                      {report.needs_immediate_professional_care ? "Urgent" : "Normal"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(report.generated_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                  {" — "}
                  {report.diagnosis?.[0]?.condition || "Analysis completed"}
                  {" — "}
                  AI triage estimate
                </p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
