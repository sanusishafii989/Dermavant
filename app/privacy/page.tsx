import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">Privacy Policy</h1>
          <p className="mt-2 text-sm text-secondary">Last updated: August 2026</p>
        </div>

        <Card className="space-y-4 text-sm leading-relaxed text-primary">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">1. Introduction</h2>
            <p>Dermavant, led by Sanusi Shafii, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal and medical data.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">2. Data We Collect</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li><strong className="text-primary">Account data:</strong> Full name, email, phone number, role (patient/doctor/partner/admin)</li>
              <li><strong className="text-primary">Medical data:</strong> Symptoms, AI triage reports, consultation history, prescriptions, medical records</li>
              <li><strong className="text-primary">Payment data:</strong> Transaction references and payment status (processed securely via Paystack — we do not store card details)</li>
              <li><strong className="text-primary">Location data:</strong> Doctor and pharmacy practice locations for proximity-based discovery</li>
              <li><strong className="text-primary">Usage data:</strong> App interactions, appointment bookings, pharmacy orders</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">3. How We Use Your Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li>To provide AI-assisted dermatological triage and medical consultations</li>
              <li>To connect patients with licensed doctors and verified pharmacies</li>
              <li>To process payments and manage wallet balances</li>
              <li>To maintain medical history records for continuity of care</li>
              <li>To improve our AI models and platform services</li>
              <li>To comply with regulatory and legal requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">4. Data Sharing</h2>
            <p className="text-secondary">Your data is shared only in the following circumstances:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-secondary">
              <li><strong className="text-primary">Doctor-Patient:</strong> Doctors can view medical history of patients who book consultations with them</li>
              <li><strong className="text-primary">Pharmacy-Patient:</strong> Pharmacy partners see order details for medicine purchases</li>
              <li><strong className="text-primary">Payment processor:</strong> Paystack receives transaction data for payment processing</li>
              <li><strong className="text-primary">Legal compliance:</strong> When required by law or regulatory authorities</li>
            </ul>
            <p className="mt-2 text-secondary">We do not sell your personal or medical data to third parties.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">5. Data Security</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li>All data is encrypted in transit (TLS/SSL)</li>
              <li>Authentication is managed by Clerk with industry-standard security</li>
              <li>Medical records are stored in MongoDB Atlas with access controls</li>
              <li>Role-based access ensures users only see data relevant to their role</li>
              <li>Payment data is never stored — processed entirely by Paystack</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">6. Your Rights</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li>Access your personal and medical data</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data processing (subject to legal requirements)</li>
              <li>Export your medical history for personal records</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">7. Data Retention</h2>
            <p className="text-secondary">Medical records are retained for the duration of your active account. Account data may be retained for up to 90 days after deletion for audit purposes, after which it is permanently removed.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">8. Cookies</h2>
            <p className="text-secondary">The platform uses essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">9. Children&apos;s Privacy</h2>
            <p className="text-secondary">Dermavant is not intended for users under 18. Parents or guardians may create accounts on behalf of minors for medical consultation purposes.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">10. Contact</h2>
            <p className="text-secondary">For privacy concerns or data requests, contact: <span className="text-accent-cyan">sanusishafii989@gmail.com</span></p>
          </section>
        </Card>
      </div>
    </div>
  );
}
