import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { patientNavLinks } from "@/lib/portal-nav";
import { Phone, Mail, MessageSquare, AlertCircle, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "sanusishafii989@gmail.com";
const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+234 800 000 0000";

const FAQS = [
  {
    q: "How do I book a consultation with a doctor?",
    a: "Go to 'Book Specialist' from your dashboard, select a doctor by specialization, choose a date and time, then complete the payment via Paystack.",
  },
  {
    q: "How does the AI dermatology triage work?",
    a: "Open 'Start AI Consultation' from your dashboard. Describe your symptoms and optionally upload a skin image. The AI provides preliminary possible explanations; it does not diagnose, and its estimates are not validated probabilities. Follow up with a licensed doctor for diagnosis.",
  },
  {
    q: "How do I order medicine from the e-pharmacy?",
    a: "Go to 'E-Pharmacy' from your dashboard, browse available medicines, add them to your cart, and checkout via Paystack. Your order will be fulfilled by a licensed pharmacy partner.",
  },
  {
    q: "How does the wallet system work?",
    a: "Your wallet holds your balance. You can top it up via Paystack and use it for consultations, pharmacy orders, and other services. Transaction history is available in the Wallet page.",
  },
  {
    q: "What happens if my payment fails?",
    a: "If your payment fails, you'll be redirected to a payment failed page. You can retry the payment from your dashboard. No charges are applied for failed transactions.",
  },
  {
    q: "Can I access my medical history?",
    a: "Yes. Go to 'Medical History' from your dashboard to view your AI triage reports, consultation records, prescriptions, and vitals. You can also export your history as a PDF.",
  },
  {
    q: "Is my medical data secure?",
    a: "Yes. All data is encrypted in transit. Authentication is managed by Clerk with industry-standard security. Medical records are stored securely in MongoDB Atlas. Read our Privacy Policy for full details.",
  },
];

export default function EmergencySupportPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Emergency contact */}
        <Card className="border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-500">Emergency support</p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Need urgent help?</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                If you are experiencing a medical emergency, please contact your nearest emergency services immediately.
                For platform support, use the channels below.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact options */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Call us</p>
              <p className="mt-1 font-medium text-[var(--text-primary)]">{contactPhone}</p>
            </div>
          </Card>
          <Card className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Email us</p>
              <p className="mt-1 font-medium text-[var(--text-primary)]">{contactEmail}</p>
            </div>
          </Card>
          <Card className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Live chat</p>
              <p className="mt-1 font-medium text-[var(--text-primary)]">Coming soon</p>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">FAQ</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-[var(--text-primary)]">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
