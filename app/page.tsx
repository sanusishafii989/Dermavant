import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Mail,
  MapPin as LocationIcon,
  MessageSquare,
  Phone,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Video,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingContactForm } from "@/components/landing/LandingContactForm";
import { DermavantScene3D } from "@/components/landing/DermavantScene3D";
import { ClinicGallery } from "@/components/landing/ClinicGallery";
import { SafeClinicalPhoto } from "@/components/landing/SafeClinicalPhoto";

const STEPS = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Sign up as a patient, doctor, or pharmacy partner. Access your dedicated portal with clear consent and privacy protection.",
  },
  {
    number: "02",
    title: "Run AI Skin Triage",
    description:
      "Describe symptoms and share clear skin photos with Dermavant's Gemini triage suite to receive structured care guidance.",
  },
  {
    number: "03",
    title: "Consult Licensed Doctors",
    description:
      "Connect with verified physicians via video, voice, or messaging and receive digital prescriptions in one medical timeline.",
  },
  {
    number: "04",
    title: "Verify & Collect Medicine",
    description:
      "Order prescriptions from audited local pharmacies with QR verification, Paystack checkout, and continuous follow-ups.",
  },
];

const ECOSYSTEM_HIGHLIGHTS = [
  {
    index: "01",
    title: "Multimodal Skin Triage",
    detail: "Photo + symptom screening via Google Gemini",
  },
  {
    index: "02",
    title: "Four Clinical Portals",
    detail: "Patient, Doctor, E-Pharmacy & Admin RBAC",
  },
  {
    index: "03",
    title: "Open Clinic Discovery",
    detail: "GPS & OpenStreetMap provider routing",
  },
  {
    index: "04",
    title: "QR-Verified Pharmacy",
    detail: "Audited medication stock & Paystack flow",
  },
];

export default function HomePage() {
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Dermavant";
  const companyTagline =
    process.env.NEXT_PUBLIC_COMPANY_TAGLINE ||
    "AI Dermatology & Digital Healthcare Ecosystem";
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "sanusishafii989@gmail.com";
  const contactPhone =
    process.env.NEXT_PUBLIC_CONTACT_PHONE || "+234 800 000 0000";
  const contactAddress =
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Yola, Adamawa State, Nigeria";
  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Sanusi Shafii";
  const founderTitle =
    process.env.NEXT_PUBLIC_FOUNDER_TITLE ||
    "Creator & Technical Lead — GDG Yola DevFest 2026";
  const socialGithub = process.env.NEXT_PUBLIC_SOCIAL_GITHUB;
  const socialTwitter = process.env.NEXT_PUBLIC_SOCIAL_TWITTER;
  const socialLinkedin = process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN;
  const socialInstagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM;

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <LandingNav />

      {/* 1. Hero Split with Interactive 3D Dermal Model */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-gold/5"
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:pb-20 md:pt-16">
          <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Copy & Primary Action */}
            <div className="flex min-w-0 flex-col justify-center lg:col-span-5">
              <p className="text-xs font-medium tracking-[0.14em] text-accent-cyan uppercase">
                GDG Yola DevFest 2026 · Powered by Google Gemini
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-[3.25rem] text-balance">
                Precision Skin Triage{" "}
                <span className="text-accent-cyan">Built for Real Care</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
                {companyName} connects patients, dermatologists, and audited pharmacies — combining interactive dermal triage, video consultations, and verified medicine in one continuous health platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/sign-up">
                  <Button variant="primary" size="lg" className="whitespace-nowrap">
                    Start Free Triage
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <a
                  href="#care-gallery"
                  className="inline-flex whitespace-nowrap items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:text-accent-cyan"
                >
                  See Clinical Care
                </a>
              </div>

              {/* Real Human Care Team Strip */}
              <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
                <div className="flex -space-x-3 shrink-0">
                  {[
                    {
                      src: "/images/dermatology-exam.jpg",
                      alt: "Dermatologist using optical dermatoscope",
                    },
                    {
                      src: "/images/nurse-patient-care.jpg",
                      alt: "Nurse smiling with patient in clinic",
                    },
                    {
                      src: "/images/doctor-consultation.jpg",
                      alt: "Physician taking consultation notes",
                    },
                  ].map((portrait) => (
                    <div
                      key={portrait.src}
                      className="h-11 w-11 overflow-hidden rounded-full border-2 border-background bg-surface-elevated"
                    >
                      <SafeClinicalPhoto
                        src={portrait.src}
                        alt={portrait.alt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Patient · Doctor · Pharmacy · Admin
                  </p>
                  <p className="text-xs text-secondary">
                    Supporting clinicians and communities across Yola and beyond
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Three.js 3D Dermal Scanner Viewport */}
            <div className="flex min-w-0 lg:col-span-7">
              <DermavantScene3D />
            </div>
          </div>

          {/* Full-Width 4-Column Capability Strip below Hero Split */}
          <div className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM_HIGHLIGHTS.map((item) => (
              <div key={item.index} className="space-y-1">
                <p className="font-mono text-xs font-medium tabular-nums text-accent-cyan">
                  {item.index}
                </p>
                <h2 className="text-sm font-semibold text-primary">{item.title}</h2>
                <p className="text-xs leading-relaxed text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Real Human Healthcare & Patient Photography Gallery */}
      <ClinicGallery />

      {/* 3. Platform Features */}
      <section id="services" className="border-t border-border bg-surface-elevated py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
              Platform Capabilities
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl text-balance">
              Purpose-built tools for every step of skin and primary care
            </h2>
          </div>

          <div className="mt-16 space-y-24">
            {/* Feature 1: Multimodal AI Triage */}
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <Brain className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-primary md:text-3xl">
                  01. Clinical AI Skin Triage
                </h3>
                <p className="mt-4 text-base leading-relaxed text-secondary">
                  Dermavant analyzes patient symptom descriptions, clinical skin photos, and medical history via Google Gemini with condition-tagged dermatology RAG retrieval — giving clinicians an organized pre-visit summary instead of guesswork.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Multimodal image + symptom triage via @google/genai",
                    "Grounded guidance across 120+ dermatological reference entries",
                    "Automated urgency sorting and specialist booking handoff",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-secondary">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-theme">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <span className="text-xs font-semibold text-primary">
                    Dermavant Triage Summary
                  </span>
                  <span className="font-mono text-xs text-accent-cyan">
                    Gemini Clinical RAG
                  </span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-12">
                  <div className="relative h-44 overflow-hidden rounded-xl border border-border sm:col-span-5 sm:h-auto">
                    <SafeClinicalPhoto
                      src="/images/patient-support.jpg"
                      alt="Healthcare nurse supporting a patient during skin care screening"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-3 sm:col-span-7">
                    <div className="rounded-xl bg-surface-elevated p-3.5 text-sm text-secondary">
                      <p className="text-xs font-semibold text-primary">Patient Report</p>
                      <p className="mt-1">
                        Persistent itchy red patch on forearm for 3 days after new soap exposure.
                      </p>
                    </div>
                    <div className="rounded-xl border border-accent-cyan/25 bg-accent-cyan/10 p-3.5 text-sm text-primary">
                      <p className="text-xs font-semibold text-accent-cyan">
                        Preliminary Triage Impression
                      </p>
                      <p className="mt-1 text-secondary">
                        Pattern aligns with contact dermatitis. Routine dermatologist consultation recommended; avoid irritating fragrance washes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Telemedicine & QR Verified Pharmacy */}
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="order-2 w-full rounded-2xl border border-border bg-surface p-6 shadow-theme lg:order-1">
                <div className="flex items-center gap-4 border-b border-border pb-5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated">
                    <SafeClinicalPhoto
                      src="/images/doctor-consultation.jpg"
                      alt="Licensed doctor ready for consultation"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-primary">
                      Licensed Dermatology & Primary Care
                    </p>
                    <p className="text-xs text-secondary">
                      Verified Specialist Network · Video & Voice Ready
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-emerald-500">
                    Open Slots
                  </span>
                </div>

                <div className="my-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border p-3 text-center">
                    <Video className="mx-auto mb-1.5 h-5 w-5 text-accent-gold" aria-hidden="true" />
                    <span className="text-xs font-medium text-secondary">Video Consult</span>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <MessageSquare className="mx-auto mb-1.5 h-5 w-5 text-accent-cyan" aria-hidden="true" />
                    <span className="text-xs font-medium text-secondary">Clinical Chat</span>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <QrCode className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" aria-hidden="true" />
                    <span className="text-xs font-medium text-secondary">QR Pharmacy</span>
                  </div>
                </div>

                <Link href="/sign-up?role=patient" className="block">
                  <Button className="w-full" variant="primary">
                    Book a Specialist Consultation
                  </Button>
                </Link>
              </div>

              <div className="order-1 lg:order-2">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gold/10 text-accent-gold">
                  <Stethoscope className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-primary md:text-3xl">
                  02. Telemedicine & Verified E-Pharmacy
                </h3>
                <p className="mt-4 text-base leading-relaxed text-secondary">
                  Consult directly with verified medical practitioners and send prescriptions cleanly to audited local pharmacies. Every medication batch carries QR authenticity verification and protected Paystack checkout.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Verified doctor credentials & clinic GPS discovery",
                    "Shared medical timeline & downloadable PDF care summaries",
                    "Audited pharmacy stock with QR medicine verification",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-secondary">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-gold" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="border-t border-border py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
              Workflow
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">
              From symptom check to verified treatment in four steps
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6"
              >
                <span className="font-mono text-2xl font-bold tabular-nums text-accent-cyan">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. About & Founder */}
      <section id="about" className="border-t border-border bg-surface-elevated py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="min-w-0 lg:col-span-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                About Dermavant
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl text-balance">
                Built by {founderName} for GDG Yola DevFest 2026
              </h2>
              <p className="mt-5 text-base leading-relaxed text-secondary">
                {companyName} is a digital healthcare and dermatology triage platform addressing long travel distances, limited specialist access, delayed skin screening, and unsafe self-medication across Nigeria and underserved communities.
              </p>
              <p className="mt-4 text-base leading-relaxed text-secondary">
                Combining Google Gemini multimodal triage, grounded medical knowledge retrieval, licensed video consultations, OpenStreetMap clinic discovery, and QR-verified e-pharmacy logistics, {companyName} keeps patients and clinicians connected from first symptom to recovery.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm text-secondary">
                {[
                  "Role-based 4-portal architecture",
                  "Gemini multimodal skin triage",
                  "OpenStreetMap clinic locator",
                  "Paystack wallet & PDF records",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-accent-cyan" aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 space-y-6 lg:col-span-6">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border">
                <SafeClinicalPhoto
                  src="/images/community-health.jpg"
                  alt="Healthcare worker demonstrating care guidance to a patient"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-medium text-cyan-300">Community-Centered Care</p>
                  <p className="mt-1 text-base font-semibold">
                    Practical clinical tools built in Yola for everyday healthcare access
                  </p>
                </div>
              </div>

              <Card className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
                  Creator & Technical Lead
                </p>
                <div>
                  <h3 className="text-xl font-semibold text-primary">{founderName}</h3>
                  <p className="text-sm text-secondary">{founderTitle}</p>
                </div>
                <p className="text-sm leading-relaxed text-secondary">
                  &ldquo;We built Dermavant to ensure every Nigerian — regardless of location — has timely access to reliable dermatological guidance, licensed clinicians, and safe medication.&rdquo;
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact */}
      <section id="contact" className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-cyan">
              Contact
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">
              Get in touch with the Dermavant team
            </h2>
            <p className="mt-3 text-secondary">
              Questions about clinical partnerships, pharmacy onboarding, or DevFest 2026 showcase demos? Send a message below.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <Card className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Email</p>
                  <p className="truncate text-sm font-medium text-primary">{contactEmail}</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-gold/10 text-accent-gold">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Phone</p>
                  <p className="text-sm font-medium text-primary">{contactPhone}</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <LocationIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Location</p>
                  <p className="text-sm font-medium text-primary">{contactAddress}</p>
                </div>
              </Card>

              <div className="flex flex-wrap gap-3">
                {socialGithub ? (
                  <a
                    href={socialGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-accent-cyan hover:text-accent-cyan"
                  >
                    GitHub
                  </a>
                ) : null}
                {socialTwitter ? (
                  <a
                    href={socialTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-accent-cyan hover:text-accent-cyan"
                  >
                    Twitter
                  </a>
                ) : null}
                {socialLinkedin ? (
                  <a
                    href={socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-accent-cyan hover:text-accent-cyan"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {socialInstagram ? (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-accent-cyan hover:text-accent-cyan"
                  >
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>

            <LandingContactForm />
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-border bg-surface-elevated py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt={companyName}
                width={154}
                height={34}
                className="hidden h-8 w-auto dark:block"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-light.svg"
                alt={companyName}
                width={154}
                height={34}
                className="block h-8 w-auto dark:hidden"
              />
              <p className="text-sm text-secondary">{companyTagline}</p>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Platform</p>
              <div className="space-y-2">
                <a href="#care-gallery" className="block text-sm text-secondary hover:text-accent-cyan">
                  Care Gallery
                </a>
                <a href="#services" className="block text-sm text-secondary hover:text-accent-cyan">
                  Services
                </a>
                <a href="#how-it-works" className="block text-sm text-secondary hover:text-accent-cyan">
                  How It Works
                </a>
                <a href="#about" className="block text-sm text-secondary hover:text-accent-cyan">
                  About
                </a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Legal</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-secondary hover:text-accent-cyan">
                  Terms &amp; Conditions
                </Link>
                <Link href="/privacy" className="block text-sm text-secondary hover:text-accent-cyan">
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Portals</p>
              <div className="space-y-2">
                <Link href="/sign-up?role=patient" className="block text-sm text-secondary hover:text-accent-cyan">
                  Patient Sign Up
                </Link>
                <Link href="/sign-up?role=doctor" className="block text-sm text-secondary hover:text-accent-cyan">
                  Doctor Sign Up
                </Link>
                <Link href="/sign-up?role=partner" className="block text-sm text-secondary hover:text-accent-cyan">
                  Pharmacy Sign Up
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-muted">
              © 2026 {founderName} · Dermavant. Built for GDG Yola DevFest 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
