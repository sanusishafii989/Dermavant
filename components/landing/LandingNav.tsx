"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#care-gallery", label: "Care Gallery" },
    { href: "#services", label: "Services" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-8 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 md:py-4">
        <Link href="/" className="flex shrink-0 items-center whitespace-nowrap" aria-label="Dermavant home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Dermavant"
            width={154}
            height={34}
            className="hidden h-8 w-auto dark:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-light.svg"
            alt="Dermavant"
            width={154}
            height={34}
            className="block h-8 w-auto dark:hidden"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)] hover:underline underline-offset-4"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden whitespace-nowrap shrink-0 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)] sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="hidden whitespace-nowrap shrink-0 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] px-4 py-2 text-sm font-semibold text-white transition-opacity transition-colors sm:inline-flex"
          >
            Get Started
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] hover:text-[var(--accent-cyan)]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] px-4 py-2.5 text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
