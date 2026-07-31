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
            <p className="text-xs uppercase tracking-[0.32em] text-cyan">Step 1</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Describe your skin symptoms</h2>
            <p className="mt-2 text-sm text-white/70">
              Mention rash location, appearance, duration, itching or pain, and any changes over time.
            </p>
          </div>

          <div>
            <label htmlFor="symptoms" className="mb-2 block text-sm font-medium text-white/80">
              Skin symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
              placeholder="e.g. red itchy patch behind my left knee for 3 days, slightly scaly and spreading, no fever"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" variant="gold" size="lg" disabled={isLoading}>
              {isLoading ? "Analyzing…" : "Start dermatology consultation"}
            </Button>
            <p className="text-sm text-white/70">
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
            <p className="text-xs uppercase tracking-[0.32em] text-cyan">Consultation result</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Dermatology summary</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan">Clinical summary</p>
              <p className="mt-2 text-sm text-white/80">{result.clinicalSummary}</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan">Possible dermatology conditions</p>
              {result.possibleConditions.map((condition) => (
                <div key={condition.condition} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-white">{condition.condition}</p>
                    <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan">
                      {(condition.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/80">{condition.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Confidence score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{(result.confidenceScore * 100).toFixed(0)}%</p>
                <p className="mt-1 text-sm text-white/70">Based on the symptom description.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Immediate care</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {result.needsImmediateProfessionalCare ? "Yes" : "No"}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {result.needsImmediateProfessionalCare
                    ? "Please seek a healthcare professional without delay."
                    : "Monitor symptoms and follow the next steps."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan">Recommended next steps</p>
              <p className="mt-2 text-sm text-white/80">{result.recommendedNextSteps}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan">Follow-up guidance</p>
              <p className="mt-2 text-sm text-white/80">{result.followUpGuidance}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
