import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aetheris Health — AI-Powered Digital Healthcare Ecosystem",
  description:
    "Connecting patients to instant dermatological triage, licensed doctors, and verified medicine — all in one platform.",
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
    title: "Aetheris Health",
  },
};

export const viewport: Viewport = {
  themeColor: "#023047",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){}})();`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <ThemeProvider>
            {children}
            <RegisterSW />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
