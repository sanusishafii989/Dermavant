"use client";

import { useState } from "react";
import { SafeClinicalPhoto } from "@/components/landing/SafeClinicalPhoto";

type CareCategory = "all" | "dermatology" | "nursing" | "telemedicine";

interface CareStory {
  id: string;
  category: Exclude<CareCategory, "all">;
  categoryLabel: string;
  title: string;
  caption: string;
  image: string;
  alt: string;
  objectPosition?: string;
}

const CARE_STORIES: CareStory[] = [
  {
    id: "dermoscopy",
    category: "dermatology",
    categoryLabel: "Dermatology",
    title: "Guided Dermoscopy & Pre-Visit Screening",
    caption:
      "Patients capture clear skin photos for structured Gemini triage before walking in, giving dermatologists organized symptom timelines from minute one.",
    image: "/images/dermatology-exam.jpg",
    alt: "Dermatologist inspecting a patient's skin closely using an optical dermatoscope",
    objectPosition: "object-center",
  },
  {
    id: "nursing-care",
    category: "nursing",
    categoryLabel: "Nursing & Triage",
    title: "Warm Clinical Continuity",
    caption:
      "Healthcare teams across Northern Nigeria stay connected to patient history, allergies, and verified prescriptions across clinics.",
    image: "/images/nurse-patient-care.jpg",
    alt: "Nurse in blue scrubs smiling while caring for an older male patient in a clinic",
    objectPosition: "object-top",
  },
  {
    id: "specialist-consult",
    category: "telemedicine",
    categoryLabel: "Telemedicine",
    title: "Doctor Consultation & Digital Prescriptions",
    caption:
      "Licensed physicians review AI skin triage briefs, conduct video or voice sessions, and dispatch QR-verified prescriptions directly to pharmacies.",
    image: "/images/doctor-consultation.jpg",
    alt: "Licensed physician in a white coat and stethoscope typing clinical consultation notes",
    objectPosition: "object-top",
  },
  {
    id: "community-outreach",
    category: "nursing",
    categoryLabel: "Community Health",
    title: "Step-by-Step Patient Education",
    caption:
      "Community health workers walk patients through early screening, wound care, and safe treatment adherence without confusing medical jargon.",
    image: "/images/community-health.jpg",
    alt: "Healthcare worker in scrubs explaining clinical diagnostic instructions to a female patient",
    objectPosition: "object-top",
  },
  {
    id: "follow-up",
    category: "dermatology",
    categoryLabel: "Follow-Up Care",
    title: "Trusted Recovery Check-Ins",
    caption:
      "Consistent follow-ups ensure treatments work safely for every skin tone, backed by clinician feedback and local pharmacy access.",
    image: "/images/patient-support.jpg",
    alt: "Nurse caring warmly for a smiling woman patient during a recovery check-in",
    objectPosition: "object-top",
  },
];

const FILTERS: Array<{ id: CareCategory; label: string }> = [
  { id: "all", label: "All Care" },
  { id: "dermatology", label: "Dermatology" },
  { id: "nursing", label: "Nursing & Triage" },
  { id: "telemedicine", label: "Telemedicine" },
];

export function ClinicGallery() {
  const [filter, setFilter] = useState<CareCategory>("all");

  const visibleStories =
    filter === "all"
      ? CARE_STORIES
      : CARE_STORIES.filter((story) => story.category === filter);

  return (
    <section id="care-gallery" className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.18em] text-accent-cyan uppercase">
              Real Human Care
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl text-balance">
              Technology built to strengthen doctors, nurses, and patients
            </h2>
            <p className="mt-3 text-base text-secondary">
              Dermavant pairs multimodal AI triage with real clinical teams so patients receive earlier answers and safer prescriptions.
            </p>
          </div>

          <div
            className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-elevated p-1 self-start md:self-auto"
            role="group"
            aria-label="Filter care stories"
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent-primary)] text-white shadow-sm"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {visibleStories.map((story, idx) => {
            const isTopRow = filter === "all" && idx < 2;
            const colSpanClass =
              filter === "all"
                ? idx === 0
                  ? "lg:col-span-7"
                  : idx === 1
                    ? "lg:col-span-5"
                    : "lg:col-span-4"
                : "lg:col-span-6";
            const heightClass = isTopRow ? "h-80 sm:h-96" : "h-72 sm:h-80";

            return (
              <article
                key={story.id}
                className={`group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-[var(--border-hover)] ${colSpanClass}`}
              >
                <div className={`relative w-full overflow-hidden ${heightClass}`}>
                  <SafeClinicalPhoto
                    src={story.image}
                    alt={story.alt}
                    fallbackLabel={story.title}
                    className={`h-full w-full object-cover ${story.objectPosition || "object-center"} transition-transform duration-300 group-hover:scale-[1.03]`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-xs font-medium text-teal-300">
                      {story.categoryLabel}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug text-white sm:text-xl">
                      {story.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/85 line-clamp-2">
                      {story.caption}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
