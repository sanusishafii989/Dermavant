"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { clerkAppearance } from "@/lib/clerk-appearance";
import {
  isUserRole,
  PORTAL_LABELS,
  ROLE_DASHBOARD,
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
  const initialRole = searchParams.get("role");
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

  const redirectUrl = useMemo(() => ROLE_DASHBOARD[role], [role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan">Create Account</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{PORTAL_LABELS[role]}</h1>
          <p className="mt-2 text-white/60">
            Choose your role and complete registration. Admin accounts cannot be
            created through this signup page.
          </p>
        </div>

        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-white/80">
              Account role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            >
              {USER_SIGNUP_ROLES.map((option) => (
                <option key={option} value={option} className="bg-navy">
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <SignUp
            appearance={clerkAppearance}
            unsafeMetadata={{ role }}
            fallbackRedirectUrl={redirectUrl}
            signInUrl={`/sign-in?portal=${role}`}
          />
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-dark text-white/70">
          Loading sign up...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
