import { Brain, FlaskConical, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function DevFestToolsCard({ aiProvider }: { aiProvider: "gemini" | "groq" }) {
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <Card className="max-w-5xl border border-[#8ab4f8]/20 bg-gradient-to-br from-[#0b1b2b] to-[var(--bg-card)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#8ab4f8]/10 p-2 text-[#8ab4f8]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ab4f8]">Google tools in this demo</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {aiProvider === "gemini"
              ? "Patient skin triage and the doctor research assistant run through the Gemini API."
              : "Groq is selected for text-only triage and doctor research; image analysis is disabled."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <Brain className="h-4 w-4 text-[#8ab4f8]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Gemini API</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            {aiProvider === "gemini" ? "Live multimodal skin-image analysis, symptom triage, and doctor research chat." : "Integrated for multimodal analysis; select Gemini to use it live."}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <Sparkles className="h-4 w-4 text-[#fbbc04]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google AI Studio</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Prompt prototyping and Gemini API key setup; it is not embedded as a runtime service.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
          <FlaskConical className="h-4 w-4 text-[#81c995]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google Colab</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">CNN notebooks are research experiments and do not power this live result.</p>
        </div>
      </div>
    </Card>
  );
}
