"use client";

import { LiteDermalOrb3D } from "@/components/patient/LiteDermalOrb3D";
import { DERMAVANT_STUDIO_CAPABILITIES } from "@/lib/liteLensMath";

export function DevFestToolsCard() {
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <section
      aria-label="Dermavant Clinical Triage Engine"
      className="max-w-5xl rounded-2xl border border-border bg-surface p-6 shadow-theme"
    >
      <div className="grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs font-medium tracking-[0.14em] text-accent-cyan uppercase">
            Dermavant Clinical Suite · GDG Yola DevFest 2026
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-primary text-balance sm:text-2xl">
            Structured Dermatology Triage &amp; Clinician Handoff
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Built with Google Gemini multimodal reasoning and vector dermatology guidelines to prepare clear symptom briefs before consulting a specialist.
          </p>

          <dl className="mt-5 divide-y divide-border border-t border-border">
            {DERMAVANT_STUDIO_CAPABILITIES.map((item) => (
              <div key={item.id} className="flex items-baseline gap-4 py-3">
                <dt className="w-6 shrink-0 font-mono text-xs font-semibold tabular-nums text-accent-cyan">
                  {item.index}
                </dt>
                <dd className="min-w-0 text-sm">
                  <span className="font-medium text-primary">{item.title}</span>
                  <span className="mx-2 text-muted" aria-hidden="true">·</span>
                  <span className="text-secondary">{item.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <LiteDermalOrb3D />
        </div>
      </div>
    </section>
  );
}
