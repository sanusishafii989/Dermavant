import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#219EBC",
    colorBackground: "#023047",
    colorText: "#FFFFFF",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#FFFFFF",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    card: "glass-card shadow-glass border border-white/10",
    headerTitle: "text-white",
    headerSubtitle: "text-white/70",
    socialButtonsBlockButton:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10",
    formButtonPrimary: "bg-cyan text-dark hover:bg-cyan/90",
    footerActionLink: "text-cyan hover:text-cyan/80",
    formFieldInput:
      "border border-white/10 bg-white/5 text-white placeholder:text-white/40",
    formFieldLabel: "text-white/80",
    identityPreviewEditButton: "text-cyan",
  },
};
