"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type PossibleCondition = {
  condition: string;
  confidence: number;
  reasoning: string;
};

type ConsultationResult = {
  clinicalSummary: string;
  possibleConditions: PossibleCondition[];
  recommendedNextSteps: string;
  followUpGuidance: string;
  confidenceScore: number;
  needsImmediateProfessionalCare: boolean;
};

export function AIConsultationWizard() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setResult(null);

    const trimmed = symptoms.trim();
    if (!trimmed) {
      setFeedback("Please describe your skin symptoms before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: trimmed }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Failed to get a response from the AI service.");
      }

      const body = await response.json();
      if (!body.ok) {
        throw new Error(body.error || "Unable to complete dermatology consultation.");
      }

      setResult(body.report);
    } catch (error: any) {
      setFeedback(error?.message || "Unable to complete the consultation.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-cyan)]">Step 1</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Describe your skin symptoms</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Mention rash location, appearance, duration, itching or pain, and any changes over time.
            </p>
          </div>

          <div>
            <label htmlFor="symptoms" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Skin symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
              placeholder="e.g. red itchy patch behind my left knee for 3 days, slightly scaly and spreading, no fever"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" variant="gold" size="lg" disabled={isLoading}>
              {isLoading ? "Analyzing…" : "Start dermatology consultation"}
            </Button>
            <p className="text-sm text-[var(--text-secondary)]">
              This is a dermatology-focused text consultation for visible skin, hair, and nail symptoms.
            </p>
          </div>

          {feedback ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {feedback}
            </div>
          ) : null}
        </form>
      </Card>

      {result ? (
        <Card className="max-w-5xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-cyan)]">Consultation result</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Dermatology summary</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Clinical summary</p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{result.clinicalSummary}</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Possible dermatology conditions</p>
              {result.possibleConditions.map((condition) => (
                <div key={condition.condition} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{condition.condition}</p>
                    <span className="rounded-full bg-[var(--accent-cyan)]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent-cyan)]">
                      {(condition.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">{condition.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Confidence score</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{(result.confidenceScore * 100).toFixed(0)}%</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Based on the symptom description.</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Immediate care</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {result.needsImmediateProfessionalCare ? "Yes" : "No"}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {result.needsImmediateProfessionalCare
                    ? "Please seek a healthcare professional without delay."
                    : "Monitor symptoms and follow the next steps."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Recommended next steps</p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{result.recommendedNextSteps}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-cyan)]">Follow-up guidance</p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{result.followUpGuidance}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
