"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AlertCircle,
  ArrowUp,
  ImagePlus,
  Loader2,
  Mic,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";
import { formatDurationMmSs, mergeTranscriptText } from "@/lib/ai/voiceUtils";

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
  provider: "gemini";
  model: string;
  includedImage: boolean;
};

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AIConsultationWizard() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preVoiceTextRef = useRef("");

  const {
    isListening,
    isTranscribing,
    isSpeaking,
    ttsEnabled,
    recordingSeconds,
    audioLevel,
    voiceError,
    clearVoiceError,
    startListening,
    stopListening,
    cancelListening,
    speak,
    toggleTts,
    speechSupported,
    ttsSupported,
  } = useVoiceChat({
    onTranscript: (liveText) => {
      setSymptoms(mergeTranscriptText(preVoiceTextRef.current, liveText));
    },
    onFinalTranscript: (finalText) => {
      setSymptoms(mergeTranscriptText(preVoiceTextRef.current, finalText));
    },
  });

  async function submitConsultation() {
    setFeedback(null);
    clearVoiceError();
    setResult(null);

    const trimmed = symptoms.trim();
    if (!trimmed && !selectedImage) {
      setFeedback("Please describe your skin symptoms or attach a photo before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: trimmed, image: selectedImage || undefined }),
      });

      let body: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          body = await response.json();
        } catch {
          body = null;
        }
      } else {
        const rawText = await response.text();
        try {
          body = JSON.parse(rawText);
        } catch {
          body = { ok: false, error: rawText };
        }
      }

      if (!response.ok || !body?.ok) {
        const message =
          typeof body?.error === "string" && body.error.trim()
            ? body.error.trim()
            : "Unable to complete dermatology consultation right now. Please try again.";
        throw new Error(message);
      }

      setResult(body.report);
      if (ttsEnabled) {
        const summary = `${body.report.clinicalSummary}. ${body.report.recommendedNextSteps}`;
        speak(summary);
      }
    } catch (error: any) {
      setFeedback(
        error?.message && !String(error.message).trim().startsWith("{")
          ? error.message
          : "Unable to complete the consultation right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitConsultation();
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setFeedback("Please choose a JPEG, PNG, or WebP skin photo.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFeedback("Please choose an image that is 3 MB or smaller.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFeedback(null);
      setSelectedImage(reader.result as string);
    };
    reader.onerror = () => setFeedback("The image could not be opened. Please choose another file.");
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else if (!isTranscribing) {
      preVoiceTextRef.current = symptoms;
      clearVoiceError();
      void startListening();
    }
  };

  const meterBars = [0.45, 0.75, 1.0, 0.8, 0.5];

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-cyan">
              Step 1
            </p>
            <h2 className="mt-1.5 text-xl font-semibold text-primary sm:text-2xl">
              Describe your skin symptoms
            </h2>
            <p className="mt-1.5 text-sm text-secondary">
              Include location, appearance, duration, itching or pain — attach a skin photo or dictate with your microphone right inside the box below.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Unified Prompt Composer Box (photo, voice dictation, textarea, and action inside one container) */}
          <div className="overflow-hidden rounded-2xl border border-border bg-[var(--bg-input)] transition-colors focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-teal-500/20">
            {/* Attached Image Chip Inside Composer */}
            {selectedImage ? (
              <div className="flex items-center gap-3.5 border-b border-border bg-surface px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt="Uploaded skin photo"
                  className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">Skin photo attached</p>
                  <p className="text-xs text-secondary">
                    Included with your symptom description for multimodal review
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove uploaded skin image"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {/* Live Recording / Transcribing Strip Inside Composer */}
            {isListening || isTranscribing ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-cyan" aria-hidden="true" />
                      <span className="text-xs font-medium text-primary">
                        Transcribing your speech into text…
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-5 items-center gap-0.5" aria-hidden="true">
                        {meterBars.map((weight, idx) => {
                          const scale = Math.max(0.28, Math.min(1, audioLevel * weight + 0.25));
                          return (
                            <span
                              key={idx}
                              style={{ transform: `scaleY(${scale})` }}
                              className="h-4 w-1 origin-center rounded-full bg-rose-500 transition-transform duration-75"
                            />
                          );
                        })}
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-rose-500">
                        {formatDurationMmSs(recordingSeconds)}
                      </span>
                      <span className="truncate text-xs text-secondary">
                        Speak freely — pauses are okay. Stops automatically after you finish.
                      </span>
                    </>
                  )}
                </div>

                {isListening ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={cancelListening}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopListening}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)]"
                    >
                      <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                      Done speaking
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Textarea Input */}
            <label htmlFor="symptoms" className="sr-only">
              Skin symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submitConsultation();
                }
              }}
              rows={5}
              disabled={isLoading}
              className="block w-full resize-none border-0 bg-transparent px-4 pb-2 pt-4 text-sm leading-relaxed text-primary placeholder:text-muted focus:outline-none focus:ring-0 sm:text-base"
              placeholder="e.g. Red itchy patch behind my left knee for 3 days, slightly scaly and spreading, no fever…"
            />

            {/* Inside-Box Action Toolbar (Upload photo, Mic dictation, Voice readout, and Submit CTA) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach skin photo"
                  aria-label="Upload skin image"
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl px-2.5 text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-accent-cyan disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Add photo</span>
                </button>

                {speechSupported ? (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading || isTranscribing}
                    title={isListening ? "Finish recording and transcribe" : "Dictate symptoms by voice"}
                    aria-label={isListening ? "Stop recording and transcribe" : "Start voice dictation"}
                    className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      isListening
                        ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                        : "text-secondary hover:bg-surface hover:text-accent-cyan"
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : isListening ? (
                      <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ) : (
                      <Mic className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {isTranscribing ? "Transcribing" : isListening ? "Stop" : "Voice"}
                    </span>
                  </button>
                ) : null}

                {ttsSupported ? (
                  <button
                    type="button"
                    onClick={toggleTts}
                    title={ttsEnabled ? "Disable voice readout" : "Read AI summary aloud"}
                    aria-label={ttsEnabled ? "Disable voice readout" : "Enable voice readout"}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      ttsEnabled
                        ? "bg-teal-500/15 text-accent-cyan"
                        : "text-secondary hover:bg-surface hover:text-accent-cyan"
                    }`}
                  >
                    {ttsEnabled ? (
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <VolumeX className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-[11px] tabular-nums text-muted md:inline">
                  {symptoms.length}/2000
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isLoading || isTranscribing || (!symptoms.trim() && !selectedImage)}
                  className="whitespace-nowrap shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      {selectedImage ? "Analyzing photo…" : "Preparing report…"}
                    </>
                  ) : (
                    <>
                      <span>Start AI triage</span>
                      <ArrowUp className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {isSpeaking ? (
            <p className="flex items-center gap-1.5 text-xs text-accent-cyan">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              Reading preliminary summary aloud
            </p>
          ) : null}

          {voiceError || feedback ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-danger-bg px-4 py-3 text-sm text-danger-text"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{voiceError || feedback}</span>
            </div>
          ) : null}
        </form>
      </Card>

      {result ? (
        <Card className="max-w-5xl space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
              <span className="font-medium uppercase tracking-[0.2em] text-accent-cyan">
                AI-assisted triage report
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{result.model}</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-semibold text-primary">
              Preliminary skin assessment
            </h2>
            <p className="mt-1.5 text-sm text-secondary">
              {result.includedImage
                ? "The uploaded image and symptom description were reviewed together."
                : "Based on the symptom description provided."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                Clinical summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-primary">{result.clinicalSummary}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                Possible explanations · not a diagnosis
              </p>
              {result.possibleConditions.map((condition) => (
                <div
                  key={condition.condition}
                  className="rounded-xl border border-border bg-surface-elevated p-4"
                >
                  <p className="text-base font-semibold text-primary">{condition.condition}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                    {condition.reasoning}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface-elevated p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                  AI estimate
                </p>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-primary">
                  {(result.confidenceScore * 100).toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-secondary">
                  A model-generated estimate, not a validated clinical probability.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                  Immediate care
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {result.needsImmediateProfessionalCare ? "Recommended" : "Routine follow-up"}
                </p>
                <p className="mt-1 text-xs text-secondary">
                  {result.needsImmediateProfessionalCare
                    ? "Please seek an in-person clinician evaluation without delay."
                    : "Monitor symptoms closely and consult a doctor if anything worsens."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                Recommended next steps
              </p>
              <p className="mt-2 text-sm leading-relaxed text-primary">
                {result.recommendedNextSteps}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                Follow-up guidance
              </p>
              <p className="mt-2 text-sm leading-relaxed text-primary">
                {result.followUpGuidance}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="border border-amber-500/35 bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-primary">Medical Disclaimer</p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              This AI-assisted tool provides preliminary educational information only. It cannot diagnose a skin condition, assess an image as reliably as a clinician, or replace care from a licensed healthcare professional. Seek professional advice for diagnosis and treatment, and urgent care for severe or rapidly worsening symptoms.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
