"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isUserRole, PORTAL_LABELS, ROLE_DASHBOARD } from "@/lib/roles";

function SignInContent() {
  const { isLoaded } = useUser();
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const searchParams = useSearchParams();
  const portal = searchParams?.get("portal");
  const role = isUserRole(portal) ? portal : null;
  const portalLabel = role ? PORTAL_LABELS[role] : "Dermavant";

  useEffect(() => {
    if (isLoaded) {
      setClerkTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => setClerkTimedOut(true), 12000);
    return () => window.clearTimeout(timeout);
  }, [isLoaded]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-cyan">Secure Access</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">{portalLabel}</h1>
          <p className="mt-2 text-secondary">Sign in to continue to your dashboard.</p>
        </div>

        {clerkTimedOut && !isLoaded ? (
          <Card className="space-y-4 p-6 text-center">
            <p className="font-semibold text-primary">Sign-in service is not responding</p>
            <p className="text-sm text-secondary">
              Check your connection and Clerk configuration, then try loading sign-in again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-accent-cyan px-5 py-3 font-semibold text-slate-950"
            >
              Retry sign in
            </button>
          </Card>
        ) : (
          <Card className="flex min-h-32 justify-center p-4">
            <SignIn
              appearance={clerkAppearance}
              fallbackRedirectUrl="/redirect"
              signUpUrl={role ? `/sign-up?role=${role}` : "/sign-up"}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
