"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { clerkAppearance } from "@/lib/clerk-appearance";
import {
  isUserRole,
  PORTAL_LABELS,
  type UserRole,
} from "@/lib/roles";

const USER_SIGNUP_ROLES: UserRole[] = ["patient", "doctor", "partner"];

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  partner: "Partner",
  admin: "Admin",
};

function SignUpContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get("role");
  const router = useRouter();

  useEffect(() => {
    // Prevent direct creation of admin accounts via the signup URL.
    if (initialRole === "admin") {
      router.push("/sign-in");
    }
  }, [initialRole, router]);
  const [role, setRole] = useState<UserRole>(
    isUserRole(initialRole) && initialRole !== "admin" ? initialRole : "patient"
  );
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-cyan">Create Account</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">{PORTAL_LABELS[role]}</h1>
          <p className="mt-2 text-secondary">
            Choose your role and complete registration. Admin accounts cannot be
            created through this signup page.
          </p>
        </div>

        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-secondary">
              Account role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-primary focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
            >
              {USER_SIGNUP_ROLES.map((option) => (
                <option key={option} value={option} className="bg-surface-elevated">
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          {/* Terms agreement */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-surface text-accent-cyan focus:ring-accent-cyan"
              />
              <span className="text-sm text-secondary">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" className="text-accent-cyan underline hover:text-accent-cyan/80">Terms &amp; Conditions</a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-accent-cyan underline hover:text-accent-cyan/80">Privacy Policy</a>.
                I understand that Aetheris Health charges a 10% commission on doctor consultations and 5% on pharmacy orders.
              </span>
            </label>
          </div>

          {agreed ? (
            <SignUp
              appearance={clerkAppearance}
              unsafeMetadata={{ role }}
              fallbackRedirectUrl="/redirect"
              signInUrl={`/sign-in?portal=${role}`}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
              Please review and accept the Terms &amp; Conditions to continue.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
          Loading sign up...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
