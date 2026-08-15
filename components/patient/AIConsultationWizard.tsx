"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSpeaking, ttsEnabled, startListening, stopListening, speak, toggleTts, speechSupported, ttsSupported } = useVoiceChat({
    onTranscript: (text) => setSymptoms(text),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setResult(null);

    const trimmed = symptoms.trim();
    if (!trimmed && !selectedImage) {
      setFeedback("Please describe your skin symptoms or upload an image before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: trimmed || "Please analyze the uploaded skin image.", image: selectedImage || undefined }),
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
      if (ttsEnabled) {
        const summary = body.report.clinicalSummary + ". " + body.report.recommendedNextSteps;
        speak(summary);
      }
    } catch (error: any) {
      setFeedback(error?.message || "Unable to complete the consultation.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setSymptoms("");
      startListening();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-cyan)]">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Describe your skin symptoms</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Mention rash location, appearance, duration, itching or pain, and any changes over time.
              </p>
            </div>
            {/* Voice + TTS + Image buttons */}
            <div className="flex items-center gap-2">
              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                    isListening
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-500 animate-pulse"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              ) : null}
              {ttsSupported ? (
                <button
                  type="button"
                  onClick={toggleTts}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                    ttsEnabled
                      ? "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                  }`}
                  title={ttsEnabled ? "Disable voice output" : "Enable voice output"}
                >
                  {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
                title="Upload skin image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {isListening ? (
            <p className="flex items-center gap-1 text-xs text-rose-500 animate-pulse"><Mic className="h-3 w-3" /> Listening — Describe your symptoms aloud</p>
          ) : null}
          {isSpeaking ? (
            <p className="flex items-center gap-1 text-xs text-[var(--accent-cyan)]"><Volume2 className="h-3 w-3" /> AI is speaking</p>
          ) : null}

          {/* Image preview */}
          {selectedImage ? (
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <img src={selectedImage} alt="Skin condition" className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">Skin image uploaded</p>
                <p className="text-xs text-[var(--text-secondary)]">The AI will analyze this image alongside your symptoms.</p>
              </div>
              <button type="button" onClick={() => setSelectedImage(null)} className="text-[var(--text-muted)] hover:text-rose-500">
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          <div>
            <label htmlFor="symptoms" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Skin symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan)]/20"
              placeholder="e.g. red itchy patch behind my left knee for 3 days, slightly scaly and spreading, no fever"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" variant="gold" size="lg" disabled={isLoading}>
              {isLoading ? "Analyzing…" : "Start dermatology consultation"}
            </Button>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> Voice input</span>
              <span className="flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Voice output</span>
              <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Image upload</span>
            </div>
          </div>

          {feedback ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
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
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{result.needsImmediateProfessionalCare ? "Yes" : "No"}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {result.needsImmediateProfessionalCare ? "Please seek a healthcare professional without delay." : "Monitor symptoms and follow the next steps."}
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

      {/* Medical disclaimer */}
      <Card className="border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Medical Disclaimer</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              The AI dermatological triage tool provides preliminary assessments only and is not a medical diagnosis.
              It does not replace consultation with a licensed healthcare professional. Always seek professional medical
              advice for diagnosis and treatment. Aetheris Health is not liable for clinical decisions made based solely
              on AI triage results. This service is intended for adults 18 years and older.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
