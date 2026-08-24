"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROLE_DASHBOARD } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default function PostLoginRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const role = (user as any)?.publicMetadata?.role;
    if (role && ROLE_DASHBOARD[role as keyof typeof ROLE_DASHBOARD]) {
      router.push(ROLE_DASHBOARD[role as keyof typeof ROLE_DASHBOARD]);
    } else {
      // Default to patient dashboard
      router.push("/patient/dashboard");
    }
  }, [isLoaded, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent" />
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
