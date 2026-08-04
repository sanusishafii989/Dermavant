"use client";

import { useState } from "react";
import { Activity, Calendar, FileText, Pill, Stethoscope, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MedicalHistoryItem, MedicalRecordCategory } from "@/types/history";

interface MedicalHistoryTimelineProps {
  items: MedicalHistoryItem[];
}

export function MedicalHistoryTimeline({ items }: MedicalHistoryTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "ai_triage") return item.category === "ai_triage";
    if (activeFilter === "consultation") return item.category === "consultation";
    if (activeFilter === "prescription") return item.category === "prescription";
    return true;
  });

  const getCategoryBadge = (category: MedicalRecordCategory) => {
    switch (category) {
      case "ai_triage":
        return <Badge variant="cyan">AI Triage</Badge>;
      case "consultation":
        return <Badge variant="gold">Consultation</Badge>;
      case "prescription":
        return <Badge variant="cyan">Prescription</Badge>;
      case "vitals_update":
        return <Badge variant="default">Vitals Update</Badge>;
      default:
        return <Badge variant="default">Clinical Record</Badge>;
    }
  };

  const getCategoryIcon = (category: MedicalRecordCategory) => {
    switch (category) {
      case "ai_triage":
        return <Activity className="h-5 w-5 text-cyan" />;
      case "consultation":
        return <Stethoscope className="h-5 w-5 text-gold" />;
      case "prescription":
        return <Pill className="h-5 w-5 text-cyan" />;
      default:
        return <FileText className="h-5 w-5 text-white/70" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
        {[
          { id: "all", label: `All Records (${items.length})` },
          { id: "ai_triage", label: "AI Triages" },
          { id: "consultation", label: "Consultations" },
          { id: "prescription", label: "Prescriptions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
              activeFilter === tab.id
                ? "bg-cyan text-dark shadow-md"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Items */}
      {filteredItems.length === 0 ? (
        <Card className="border-dashed border-white/10 p-12 text-center text-white/60">
          <FileText className="mx-auto h-12 w-12 text-white/20" />
          <p className="mt-3 text-sm font-medium">No medical history records found</p>
          <p className="mt-1 text-xs text-white/40">
            Records will automatically populate as you complete consultations and AI triages.
          </p>
        </Card>
      ) : (
        <div className="relative space-y-6 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan/40 before:via-white/10 before:to-transparent">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative pl-14">
              {/* Timeline Indicator Node */}
              <div className="absolute left-2.5 top-1.5 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-cyan/40 bg-navy shadow-md">
                {getCategoryIcon(item.category)}
              </div>

              {/* Item Detail Card */}
              <Card className="border border-white/10 bg-dark/60 p-5 backdrop-blur-md transition-all hover:border-cyan/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      {getCategoryBadge(item.category)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(item.date).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      {item.doctorName && (
                        <>
                          <span>•</span>
                          <span className="text-cyan font-medium">{item.doctorName}</span>
                          {item.doctorSpecialization && (
                            <span className="text-white/40">({item.doctorSpecialization})</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {item.status && (
                    <div className="self-start sm:self-auto">
                      <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/80">
                        {item.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Symptoms / Clinical Notes */}
                {item.symptoms && (
                  <div className="mt-3 text-xs text-white/80">
                    <span className="font-semibold text-cyan uppercase tracking-wider text-[10px]">Reported Symptoms: </span>
                    <span className="italic">{item.symptoms}</span>
                  </div>
                )}

                {item.clinicalNotes && (
                  <div className="mt-3 text-xs text-white/80">
                    <span className="font-semibold text-cyan uppercase tracking-wider text-[10px]">Clinical Notes: </span>
                    <p className="mt-1 rounded-lg bg-white/5 p-2.5 text-white/90">{item.clinicalNotes}</p>
                  </div>
                )}

                {/* Diagnosis Breakdown */}
                {item.diagnosis && item.diagnosis.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-gold uppercase tracking-wider text-[10px]">Diagnosis Breakdown:</span>
                    <div className="mt-1.5 space-y-1.5">
                      {Array.isArray(item.diagnosis) &&
                        item.diagnosis.map((d, idx) => {
                          if (typeof d === "string") {
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs text-white/90">
                                <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
                                <span>{d}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="flex items-center justify-between rounded-md bg-white/5 px-3 py-1.5 text-xs">
                              <span className="font-medium text-white">{d.condition}</span>
                              <span className="text-cyan font-semibold">{(d.confidence * 100).toFixed(0)}% Confidence</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Prescriptions */}
                {item.prescriptions && item.prescriptions.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-cyan uppercase tracking-wider text-[10px]">Prescribed Medications:</span>
                    <div className="mt-1.5 space-y-2">
                      {item.prescriptions.map((p, idx) => (
                        <div key={idx} className="rounded-lg border border-cyan/20 bg-cyan/5 p-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-white">
                            <span>{p.medication_name}</span>
                            <span className="text-cyan">{p.dosage}</span>
                          </div>
                          <p className="mt-1 text-white/60">
                            {p.frequency} for {p.duration} {p.instructions ? `• ${p.instructions}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {item.recommendation && (
                  <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-gold/90">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="h-4 w-4 text-gold" />
                      <span>Recommendation</span>
                    </div>
                    <p className="mt-1 text-white/80">{item.recommendation}</p>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
