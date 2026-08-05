import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "var(--accent-cyan)",
    colorBackground: "var(--bg-secondary)",
    colorText: "var(--text-primary)",
    colorInputBackground: "var(--bg-input)",
    colorInputText: "var(--text-primary)",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    card: "glass-card shadow-theme border border-[var(--border)]",
    headerTitle: "text-[var(--text-primary)]",
    headerSubtitle: "text-[var(--text-secondary)]",
    socialButtonsBlockButton:
      "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]",
    formButtonPrimary: "bg-[var(--accent-cyan)] text-white hover:opacity-90",
    footerActionLink: "text-[var(--accent-cyan)] hover:opacity-80",
    formFieldInput:
      "border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
    formFieldLabel: "text-[var(--text-secondary)]",
    identityPreviewEditButton: "text-[var(--accent-cyan)]",
  },
};
