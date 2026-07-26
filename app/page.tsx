import Link from "next/link";
import type { ReactNode } from "react";
import {
  HeartPulse,
  Shield,
  Stethoscope,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PORTAL_LABELS, type UserRole } from "@/lib/roles";

const portals: Array<{
  role: UserRole;
  description: string;
  icon: ReactNode;
  accent: string;
}> = [
  {
    role: "patient",
    description: "Book consultations, use the Clinical AI Suite, and manage your health wallet.",
    icon: <HeartPulse className="h-8 w-8 text-cyan" />,
    accent: "from-cyan/20 to-transparent",
  },
  {
    role: "doctor",
    description: "Manage appointments, virtual consultations, earnings, and research tools.",
    icon: <Stethoscope className="h-8 w-8 text-gold" />,
    accent: "from-gold/20 to-transparent",
  },
  {
    role: "partner",
    description: "Run your partner pharmacy catalogue, fulfil orders, and track commissions.",
    icon: <Store className="h-8 w-8 text-cyan" />,
    accent: "from-cyan/20 to-transparent",
  },
  {
    role: "admin",
    description: "Oversee users, platform health, support tickets, and audit activity.",
    icon: <Shield className="h-8 w-8 text-gold" />,
    accent: "from-gold/20 to-transparent",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark">
      <header className="border-b border-white/10 bg-navy/30 backdrop-blur-glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan">Aetheris Health</p>
            <h1 className="text-2xl font-bold text-white">Digital Healthcare Ecosystem</h1>
          </div>
          <Badge variant="cyan">Dark mode default</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            One platform. Four secure portals.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Aetheris Health connects patients, doctors, partners, and administrators
            through a shared backend with role-based access, wallet infrastructure, and
            AI-assisted care workflows.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {portals.map((portal) => (
            <Card
              key={portal.role}
              hover
              className={`relative overflow-hidden bg-gradient-to-br ${portal.accent}`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  {portal.icon}
                </div>
                <Badge variant="default">{portal.role}</Badge>
              </div>

              <h3 className="text-xl font-semibold text-white">{PORTAL_LABELS[portal.role]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{portal.description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/sign-in?portal=${portal.role}`}>
                  <Button variant="primary">Sign In</Button>
                </Link>
                <Link href={`/sign-up?role=${portal.role}`}>
                  <Button variant="secondary">Sign Up</Button>
                </Link>
              </div>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
