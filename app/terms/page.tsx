import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-secondary">Last updated: August 2026</p>
        </div>

        <Card className="space-y-4 text-sm leading-relaxed text-primary">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">1. Acceptance of Terms</h2>
            <p>By creating an account on Aetheris Health, you agree to be bound by these Terms &amp; Conditions. If you do not agree, you may not access or use the platform.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">2. Platform Description</h2>
            <p>Aetheris Health is an AI-powered digital healthcare ecosystem connecting patients with licensed doctors and verified pharmacies. The platform offers AI-assisted dermatological triage, specialist booking, e-pharmacy services, and consultation tools.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">3. Commission &amp; Fees</h2>
            <p>Aetheris Health operates on a commission-based revenue model:</p>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li><strong className="text-primary">Doctor consultations:</strong> A 10% commission is deducted from each consultation payment. Doctors receive 90% of the consultation fee.</li>
              <li><strong className="text-primary">Pharmacy orders:</strong> A 5% commission is deducted from each medicine order. Pharmacy partners receive 95% of the order total.</li>
              <li><strong className="text-primary">Patient payments:</strong> All payments are processed securely via Paystack. Prices displayed include all applicable fees.</li>
              <li><strong className="text-primary">Withdrawals:</strong> Withdrawal requests by doctors and pharmacy partners are subject to admin approval and may take 1-2 business days to process.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">4. User Roles &amp; Responsibilities</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li><strong className="text-primary">Patients:</strong> Must provide accurate medical information and use AI triage as guidance only, not a substitute for professional medical care.</li>
              <li><strong className="text-primary">Doctors:</strong> Must hold valid medical licenses and provide professional, ethical care during consultations.</li>
              <li><strong className="text-primary">Pharmacy Partners:</strong> Must maintain valid pharmacy licenses and ensure all medicines are genuine, properly stored, and not expired.</li>
              <li><strong className="text-primary">Admins:</strong> Responsible for platform oversight, user management, and dispute resolution.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">5. AI Consultation Disclaimer</h2>
            <p>The AI dermatological triage tool provides preliminary assessments only. It is not a medical diagnosis and should not replace consultation with a licensed healthcare professional. Aetheris Health is not liable for decisions made based solely on AI triage results.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">6. Privacy &amp; Data Protection</h2>
            <p>Your use of the platform is also governed by our Privacy Policy. Medical data is stored securely and shared only with your healthcare providers for consultation purposes.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">7. Prohibited Conduct</h2>
            <ul className="ml-4 list-disc space-y-1 text-secondary">
              <li>Sharing account credentials with others</li>
              <li>Attempting to access other users&apos; data without authorization</li>
              <li>Listing counterfeit or unregistered medicines (pharmacy partners)</li>
              <li>Providing false medical credentials (doctors)</li>
              <li>Using the platform for any illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">8. Limitation of Liability</h2>
            <p>Aetheris Health, operated by Danhaire Medical Services, is not liable for any indirect, incidental, or consequential damages arising from the use of the platform. Medical professionals are independently responsible for their clinical decisions.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">9. Account Suspension</h2>
            <p>Accounts may be suspended or terminated for violations of these terms, fraudulent activity, or upon request from regulatory authorities.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">10. Contact</h2>
            <p>For questions regarding these Terms, contact: <span className="text-accent-cyan">support@aetherishealth.ng</span></p>
          </section>
        </Card>
      </div>
    </div>
  );
}
