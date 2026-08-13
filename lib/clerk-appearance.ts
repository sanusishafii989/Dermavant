import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#0D9488",
    colorBackground: "#023047",
    colorText: "#FFFFFF",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#FFFFFF",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    card: "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg p-6",
    headerTitle: "text-white font-semibold text-lg",
    headerSubtitle: "text-white/60 text-sm",
    socialButtonsBlockButton:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl",
    formButtonPrimary: "bg-[#0D9488] text-white hover:opacity-90 rounded-xl font-medium",
    footerActionLink: "text-[#0D9488] hover:opacity-80",
    formFieldInput:
      "border border-white/10 bg-white/5 text-white placeholder:text-white/40 rounded-xl",
    formFieldLabel: "text-white/70 text-sm",
    identityPreviewEditButton: "text-[#0D9488]",
  },
};
