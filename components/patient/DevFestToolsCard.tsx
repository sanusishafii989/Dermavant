import { Brain, FlaskConical, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function DevFestToolsCard() {
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <Card className="max-w-5xl border border-border bg-surface">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-accent-cyan/10 p-2 text-accent-cyan">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-cyan">
            Free Google tools powering this demo
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Patient skin triage, RAG embeddings, and the doctor research assistant run exclusively on free-tier Google AI tools.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <Brain className="h-4 w-4 text-accent-cyan" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Gemini API (Free Tier)</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Multimodal skin-image analysis, structured symptom triage, Gemini Embeddings RAG, and doctor research chat.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <Sparkles className="h-4 w-4 text-accent-gold" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google AI Studio</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Prompt design, structured JSON schema prototyping, and free API key provisioning.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <FlaskConical className="h-4 w-4 text-success" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Google Colab / Kaggle T4</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Open EfficientNet-B0 dermatology CNN research notebooks (clinician-review baselines, separate from live triage).
          </p>
        </div>
      </div>
    </Card>
  );
}
