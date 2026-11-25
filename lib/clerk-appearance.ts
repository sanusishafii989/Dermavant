import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#0D9488",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-none p-6",
    headerTitle: "text-[var(--text-primary)] font-semibold text-lg",
    headerSubtitle: "text-[var(--text-secondary)] text-sm",
    socialButtonsBlockButton:
      "border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-xl",
    formButtonPrimary:
      "bg-[#0D9488] text-white hover:bg-[#0F766E] rounded-xl font-medium",
    footerActionLink: "text-[var(--accent-cyan)] hover:opacity-80",
    formFieldInput:
      "border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl",
    formFieldLabel: "text-[var(--text-secondary)] text-sm",
    dividerLine: "bg-[var(--border)]",
    dividerText: "text-[var(--text-muted)]",
    identityPreviewEditButton: "text-[var(--accent-cyan)]",
  },
};
