import Link from "next/link";
import Image from "next/image";
import {
  HeartPulse,
  Shield,
  Stethoscope,
  Store,
  Brain,
  Video,
  Pill,
  QrCode,
  MapPin,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  MapPin as LocationIcon,
  MessageSquare,
  Menu,
  X,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingContactForm } from "@/components/landing/LandingContactForm";

const STEPS = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up as a patient, doctor, or pharmacy partner. Choose your role and get started in minutes.",
  },
  {
    number: "02",
    title: "Get AI Triage or Book",
    description: "Use the Clinical AI Suite for instant dermatology assessment, or book a specialist consultation directly.",
  },
  {
    number: "03",
    title: "Consult & Treat",
    description: "Connect with licensed doctors via video, voice, or chat. Get prescriptions and treatment plans.",
  },
  {
    number: "04",
    title: "Order & Follow Up",
    description: "Purchase verified medicines from the e-pharmacy, track your medical history, and schedule follow-ups.",
  },
];

export default function HomePage() {
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Aetheris Health";
  const companyTagline = process.env.NEXT_PUBLIC_COMPANY_TAGLINE || "Digital Healthcare Ecosystem";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@aetherishealth.ng";
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+234 800 000 0000";
  const contactAddress = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Abuja, Nigeria";
  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Ibrahim Hussaini Danhaire";
  const founderTitle = process.env.NEXT_PUBLIC_FOUNDER_TITLE || "Founder, Danhaire Medical Services";
  const socialGithub = process.env.NEXT_PUBLIC_SOCIAL_GITHUB;
  const socialTwitter = process.env.NEXT_PUBLIC_SOCIAL_TWITTER;
  const socialLinkedin = process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN;
  const socialInstagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[accent-cyan]/5 via-transparent to-[accent-gold]/5" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-secondary">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              NextGen Innovation Challenge 2026 — National Showcase
            </div>
            <h1 className="text-4xl font-bold leading-tight text-primary md:text-6xl">
              AI-Powered Healthcare
              <span className="block text-accent-cyan">for Everyone, Everywhere</span>
            </h1>
            <p className="mt-6 text-lg text-secondary md:text-xl">
              {companyName} connects patients to instant dermatological triage, licensed doctors, and verified medicine — all in one platform.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button variant="primary" size="lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#services">
                <Button variant="secondary" size="lg">Explore Services</Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { label: "AI-Assisted Triage", value: "Smart" },
                { label: "Secure Portals", value: "Role-Based" },
                { label: "Verified Pharmacies", value: "Authentic" },
                { label: "Integrated Payments", value: "Paystack" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-accent-cyan md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted md:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Patient Journey & Trust Signals */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Your Health Journey</p>
            <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">From Symptom to Recovery</h2>
            <p className="mt-4 text-secondary max-w-2xl mx-auto">We&apos;ve streamlined the healthcare experience so you can get the care you need without the friction.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="relative flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/20">
                <Brain className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-primary">1. Initial Triage</h3>
              <p className="text-secondary text-sm">
                Describe your symptoms to our clinical AI. It securely analyzes your input to recommend the right type of specialist or care urgency.
              </p>
            </div>
            <div className="relative flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gold/10 text-accent-gold ring-1 ring-accent-gold/20">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-primary">2. Specialist Consult</h3>
              <p className="text-secondary text-sm">
                Connect with verified, licensed doctors via secure video or chat. Get a professional diagnosis and prescription from the comfort of home.
              </p>
            </div>
            <div className="relative flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <Pill className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-primary">3. Verified Pharmacy</h3>
              <p className="text-secondary text-sm">
                Order prescribed medications from our network of audited pharmacies. Every medicine features QR verification for authenticity and safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features with UI Mocks */}
      <section id="services" className="border-t border-border bg-surface-elevated py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Capabilities</p>
            <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">Platform Features</h2>
            <p className="mt-4 text-secondary max-w-2xl mx-auto">Purpose-built tools for patients, doctors, and pharmacies.</p>
          </div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-primary md:text-3xl">Clinical AI Triage</h3>
                <p className="mt-4 text-lg text-secondary">
                  Our advanced AI model analyzes patient symptoms, photos, and medical history to provide an immediate preliminary assessment. It helps route you to the correct specialist and severity level before you even book an appointment.
                </p>
                <ul className="mt-8 space-y-3">
                  {["Secure symptom analysis", "Confidence-scored recommendations", "Automated specialist routing"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-secondary">
                      <CheckCircle2 className="h-5 w-5 text-accent-cyan" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-xl lg:ml-auto w-full">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-muted">AI_Triage_Console</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-accent-cyan/20" />
                    <div className="rounded-2xl rounded-tl-none bg-surface-elevated p-3 text-sm text-secondary">
                      I&apos;ve noticed a persistent red rash on my arm for the last 3 days. It&apos;s slightly itchy.
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-accent-gold/20" />
                    <div className="rounded-2xl rounded-tr-none bg-accent-cyan/10 p-3 text-sm text-primary">
                      <p className="font-medium text-accent-cyan mb-1">Preliminary Assessment</p>
                      Based on the description, this could be contact dermatitis. I recommend booking a general dermatologist for a confirmed diagnosis.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1 relative rounded-2xl border border-border bg-surface p-6 shadow-xl w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-surface-elevated animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 rounded bg-surface-elevated" />
                    <div className="h-3 w-1/4 rounded bg-surface-elevated/50" />
                  </div>
                  <Badge variant="success">Available Now</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl border border-border p-3 text-center">
                    <Video className="mx-auto h-5 w-5 text-accent-gold mb-1" />
                    <span className="text-xs text-secondary">Video Call</span>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <MessageSquare className="mx-auto h-5 w-5 text-accent-cyan mb-1" />
                    <span className="text-xs text-secondary">Secure Chat</span>
                  </div>
                </div>
                <Button className="w-full" variant="primary">Book Consultation</Button>
              </div>
              <div className="order-1 lg:order-2">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gold/10 text-accent-gold">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-primary md:text-3xl">Telemedicine Suite</h3>
                <p className="mt-4 text-lg text-secondary">
                  Connect seamlessly with verified healthcare professionals. Our telemedicine suite supports high-quality video consultations, voice calls, and secure messaging with end-to-end encryption.
                </p>
                <ul className="mt-8 space-y-3">
                  {["Verified medical practitioners", "Secure video & chat infrastructure", "Instant digital prescriptions"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-secondary">
                      <CheckCircle2 className="h-5 w-5 text-accent-gold" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Process</p>
            <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">How It Works</h2>
            <p className="mt-4 text-secondary">From sign-up to treatment in four simple steps.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {index < STEPS.length - 1 ? (
                  <div className="absolute top-8 left-[60%] hidden h-[2px] w-full bg-gradient-to-r from-[accent-cyan]/40 to-transparent lg:block" />
                ) : null}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[accent-cyan]/10 text-2xl font-bold text-accent-cyan">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border bg-surface-elevated py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">About Us</p>
              <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
                Built by Danhaire Medical Services
              </h2>
              <p className="mt-6 text-secondary">
                {companyName} is an AI-powered digital healthcare ecosystem that bridges the gap between patients and quality healthcare.
                Founded by {founderName}, the platform addresses critical healthcare challenges in Nigeria and beyond — long travel distances,
                limited specialist access, unsafe self-medication, and delayed triage.
              </p>
              <p className="mt-4 text-secondary">
                Our solution combines AI-assisted dermatology triage, specialist video/voice/chat booking, QR-verified e-pharmacy,
                GPS-based provider discovery, and integrated payments — all in one continuous patient journey.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Role-based access control (4 portals)",
                  "AI triage with knowledge base (RAG)",
                  "Paystack payment integration",
                  "Wallet system with commission tracking",
                  "Terms & Privacy compliance",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-cyan" />
                    <span className="text-sm text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Founder</p>
                <div>
                  <h3 className="text-xl font-semibold text-primary">{founderName}</h3>
                  <p className="text-sm text-secondary">{founderTitle}</p>
                </div>
                <p className="text-sm text-secondary">
                  &ldquo;We built Aetheris Health to ensure every Nigerian — regardless of location — has access to quality healthcare through technology.&rdquo;
                </p>
              </Card>

              <Card className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-accent-gold">Built for Trusted Care</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-secondary">Private patient accounts</div>
                  <div className="text-secondary">Clinically guided triage</div>
                  <div className="text-secondary">Verified care providers</div>
                  <div className="text-secondary">Secure consultations</div>
                  <div className="text-secondary">Protected payments</div>
                  <div className="text-secondary">Connected care history</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Contact</p>
            <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">Get In Touch</h2>
            <p className="mt-4 text-secondary">Have questions? We&apos;re here to help.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact info */}
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[accent-cyan]/10 text-accent-cyan">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">Email</p>
                    <p className="text-primary">{contactEmail}</p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[accent-gold]/10 text-accent-gold">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">Phone</p>
                    <p className="text-primary">{contactPhone}</p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[accent-cyan]/10 text-accent-cyan">
                    <LocationIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">Address</p>
                    <p className="text-primary">{contactAddress}</p>
                  </div>
                </div>
              </Card>

              {/* Social links */}
              <div className="flex gap-3">
                {socialGithub ? (
                  <a href={socialGithub} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-[accent-cyan] hover:text-accent-cyan">
                    GitHub
                  </a>
                ) : null}
                {socialTwitter ? (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-[accent-cyan] hover:text-accent-cyan">
                    Twitter
                  </a>
                ) : null}
                {socialLinkedin ? (
                  <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-[accent-cyan] hover:text-accent-cyan">
                    LinkedIn
                  </a>
                ) : null}
                {socialInstagram ? (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-secondary transition-colors hover:border-[accent-cyan] hover:text-accent-cyan">
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>

            {/* Contact form */}
            <LandingContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-elevated py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <Image
                src="/logo.svg"
                alt={companyName}
                width={140}
                height={28}
                priority
                className="dark:block hidden"
              />
              <Image
                src="/logo-light.svg"
                alt={companyName}
                width={140}
                height={28}
                priority
                className="dark:hidden block"
              />
              <p className="text-sm text-secondary">{companyTagline}</p>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Platform</p>
              <div className="space-y-2">
                <a href="#services" className="block text-sm text-secondary hover:text-accent-cyan">Services</a>
                <a href="#how-it-works" className="block text-sm text-secondary hover:text-accent-cyan">How It Works</a>
                <a href="#about" className="block text-sm text-secondary hover:text-accent-cyan">About Us</a>
                <a href="#contact" className="block text-sm text-secondary hover:text-accent-cyan">Contact</a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Legal</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-secondary hover:text-accent-cyan">Terms &amp; Conditions</Link>
                <Link href="/privacy" className="block text-sm text-secondary hover:text-accent-cyan">Privacy Policy</Link>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Get Started</p>
              <div className="space-y-2">
                <Link href="/sign-up?role=patient" className="block text-sm text-secondary hover:text-accent-cyan">Patient Sign Up</Link>
                <Link href="/sign-up?role=doctor" className="block text-sm text-secondary hover:text-accent-cyan">Doctor Sign Up</Link>
                <Link href="/sign-up?role=partner" className="block text-sm text-secondary hover:text-accent-cyan">Pharmacy Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-muted">
              © 2026 Danhaire Medical Services. All rights reserved. Built for the NextGen Innovation Challenge 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
