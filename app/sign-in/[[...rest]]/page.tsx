"use client";

import dynamic from "next/dynamic";
// Load Clerk SignIn only on the client to avoid hydration mismatches
const SignIn = dynamic(() => import("@clerk/nextjs").then((m) => m.SignIn), { ssr: false });
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isUserRole, PORTAL_LABELS, ROLE_DASHBOARD } from "@/lib/roles";

function SignInContent() {
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal");
  const role = isUserRole(portal) ? portal : null;
  const portalLabel = role ? PORTAL_LABELS[role] : "Aetheris Health";

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan">Secure Access</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{portalLabel}</h1>
          <p className="mt-2 text-white/60">Sign in to continue to your dashboard.</p>
        </div>

        <Card className="flex justify-center p-4">
          <SignIn
            appearance={clerkAppearance}
            fallbackRedirectUrl={role ? ROLE_DASHBOARD[role] : "/patient/dashboard"}
            signUpUrl={role ? `/sign-up?role=${role}` : "/sign-up"}
          />
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-dark text-white/70">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
