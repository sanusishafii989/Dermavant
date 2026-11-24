import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { DevFestBanner } from "@/components/shared/DevFestBanner";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const devFestMode = process.env.NEXT_PUBLIC_DEVFEST_MODE !== "false";

export const metadata: Metadata = {
  title: devFestMode
    ? "Dermavant — GDG Yola DevFest 2026"
    : "Dermavant — AI Dermatology & Digital Healthcare",
  description:
    devFestMode
      ? "Built by Sanusi Shafii for GDG Yola DevFest 2026, powered by free Google Gemini multimodal skin triage."
      : "Connecting patients to instant dermatological triage, licensed doctors, and verified medicine — all in one platform.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dermavant",
  },
};

export const viewport: Viewport = {
  themeColor: "#023047",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html
        lang="en"
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){}})();`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background font-sans text-primary">
          <ThemeProvider>
            <DevFestBanner />
            {children}
            <RegisterSW />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
