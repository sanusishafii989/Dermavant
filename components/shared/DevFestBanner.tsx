"use client";

import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function DevFestBanner() {
  const pathname = usePathname();

  // Keep the public landing page focused on the Aetheris Health brand.
  if (pathname === "/") return null;
  if (process.env.NEXT_PUBLIC_DEVFEST_MODE === "false") return null;

  return (
    <div className="border-b border-white/10 bg-[#081a2c] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:text-sm">
        <Sparkles className="h-4 w-4 text-[#8ab4f8]" aria-hidden="true" />
        <span className="font-semibold">GDG Yola DevFest 2026 Demo</span>
        <span className="hidden text-white/45 sm:inline">·</span>
        <span className="text-white/75">
          Dermavant (Aetheris Health) — Free Google Gemini multimodal skin triage
        </span>
      </div>
    </div>
  );
}
