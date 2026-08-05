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
  Menu,
  X,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LandingContactForm } from "@/components/landing/LandingContactForm";

const SERVICES = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI Dermatology Triage",
    description: "Instant AI-powered assessment of skin conditions with evidence-based recommendations and confidence scoring.",
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: "Specialist Consultations",
    description: "Book video, voice, or chat consultations with licensed doctors across multiple specializations.",
  },
  {
    icon: <Pill className="h-6 w-6" />,
    title: "E-Pharmacy Marketplace",
    description: "Browse and order verified medicines from licensed pharmacy partners with home delivery.",
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: "QR-Verified Medicines",
    description: "Every medicine listing includes a unique QR code for authenticity verification and patient safety.",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "GPS Doctor Discovery",
    description: "Find nearby doctors and pharmacies using location-based search with interactive maps.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Integrated Payments",
    description: "Secure Paystack integration for consultations, pharmacy orders, and wallet top-ups.",
  },
];

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

const PORTALS = [
  {
    role: "patient",
    label: "Patient Portal",
    description: "Book consultations, use AI triage, manage your health wallet, and order medicines.",
    icon: <HeartPulse className="h-6 w-6" />,
    accent: "var(--accent-cyan)",
  },
  {
    role: "doctor",
    label: "Doctor Portal",
    description: "Manage appointments, conduct virtual consultations, track earnings, and access research tools.",
    icon: <Stethoscope className="h-6 w-6" />,
    accent: "var(--accent-gold)",
  },
  {
    role: "partner",
    label: "Pharmacy Portal",
    description: "Manage your medicine catalogue, fulfil orders, track commissions, and process withdrawals.",
    icon: <Store className="h-6 w-6" />,
    accent: "var(--accent-cyan)",
  },
  {
    role: "admin",
    label: "Admin Portal",
    description: "Oversee all users, monitor platform health, manage support tickets, and review audit logs.",
    icon: <Shield className="h-6 w-6" />,
    accent: "var(--accent-gold)",
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
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
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#services" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">Services</a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">How It Works</a>
            <a href="#about" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">About</a>
            <a href="#contact" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up" className="hidden sm:block">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-cyan)]/5 via-transparent to-[var(--accent-gold)]/5" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-1.5 text-sm text-[var(--text-secondary)]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              NextGen Innovation Challenge 2026 — National Showcase
            </div>
            <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-6xl">
              AI-Powered Healthcare
              <span className="block text-[var(--accent-cyan)]">for Everyone, Everywhere</span>
            </h1>
            <p className="mt-6 text-lg text-[var(--text-secondary)] md:text-xl">
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
                { label: "AI Triage Accuracy", value: "85%+" },
                { label: "Portal Access", value: "24/7" },
                { label: "User Roles", value: "4" },
                { label: "Payment Ready", value: "Paystack" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-[var(--accent-cyan)] md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="border-t border-[var(--border)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Portals</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">One Platform. Four Secure Portals.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Role-based access ensures every user sees exactly what they need.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((portal) => (
              <Card key={portal.role} hover className="space-y-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${portal.accent === "var(--accent-cyan)" ? "rgba(13,148,136,0.12)" : "rgba(217,119,6,0.12)"}`, color: portal.accent }}
                >
                  {portal.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{portal.label}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{portal.description}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/sign-in?portal=${portal.role}`}>
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  {portal.role !== "admin" ? (
                    <Link href={`/sign-up?role=${portal.role}`}>
                      <Button variant="secondary" size="sm">Sign Up</Button>
                    </Link>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Services</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Comprehensive Healthcare Services</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Everything you need for a complete digital healthcare experience.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.title} hover className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{service.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{service.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-[var(--border)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Process</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">How It Works</h2>
            <p className="mt-4 text-[var(--text-secondary)]">From sign-up to treatment in four simple steps.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {index < STEPS.length - 1 ? (
                  <div className="absolute top-8 left-[60%] hidden h-[2px] w-full bg-gradient-to-r from-[var(--accent-cyan)]/40 to-transparent lg:block" />
                ) : null}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-cyan)]/10 text-2xl font-bold text-[var(--accent-cyan)]">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">About Us</p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
                Built by Danhaire Medical Services
              </h2>
              <p className="mt-6 text-[var(--text-secondary)]">
                {companyName} is an AI-powered digital healthcare ecosystem that bridges the gap between patients and quality healthcare.
                Founded by {founderName}, the platform addresses critical healthcare challenges in Nigeria and beyond — long travel distances,
                limited specialist access, unsafe self-medication, and delayed triage.
              </p>
              <p className="mt-4 text-[var(--text-secondary)]">
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
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-cyan)]" />
                    <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Founder</p>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">{founderName}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{founderTitle}</p>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  &ldquo;We built Aetheris Health to ensure every Nigerian — regardless of location — has access to quality healthcare through technology.&rdquo;
                </p>
              </Card>

              <Card className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">Tech Stack</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-[var(--text-secondary)]">Frontend: Next.js 15</div>
                  <div className="text-[var(--text-secondary)]">Database: MongoDB</div>
                  <div className="text-[var(--text-secondary)]">Auth: Clerk</div>
                  <div className="text-[var(--text-secondary)]">AI: Groq + RAG</div>
                  <div className="text-[var(--text-secondary)]">Payments: Paystack</div>
                  <div className="text-[var(--text-secondary)]">Maps: Leaflet</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-[var(--border)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Contact</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Get In Touch</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Have questions? We&apos;re here to help.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact info */}
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Email</p>
                    <p className="text-[var(--text-primary)]">{contactEmail}</p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Phone</p>
                    <p className="text-[var(--text-primary)]">{contactPhone}</p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    <LocationIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Address</p>
                    <p className="text-[var(--text-primary)]">{contactAddress}</p>
                  </div>
                </div>
              </Card>

              {/* Social links */}
              <div className="flex gap-3">
                {socialGithub ? (
                  <a href={socialGithub} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]">
                    GitHub
                  </a>
                ) : null}
                {socialTwitter ? (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]">
                    Twitter
                  </a>
                ) : null}
                {socialLinkedin ? (
                  <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]">
                    LinkedIn
                  </a>
                ) : null}
                {socialInstagram ? (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]">
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
      <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-12">
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
              <p className="text-sm text-[var(--text-secondary)]">{companyTagline}</p>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Platform</p>
              <div className="space-y-2">
                <a href="#services" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Services</a>
                <a href="#how-it-works" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">How It Works</a>
                <a href="#about" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">About Us</a>
                <a href="#contact" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Contact</a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Legal</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Terms &amp; Conditions</Link>
                <Link href="/privacy" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Privacy Policy</Link>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Get Started</p>
              <div className="space-y-2">
                <Link href="/sign-up?role=patient" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Patient Sign Up</Link>
                <Link href="/sign-up?role=doctor" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Doctor Sign Up</Link>
                <Link href="/sign-up?role=partner" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">Pharmacy Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              © 2026 Danhaire Medical Services. All rights reserved. Built for the NextGen Innovation Challenge 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}