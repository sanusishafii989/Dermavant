"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Aetheris Health"
            width={130}
            height={26}
            priority
            className="dark:block hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Aetheris Health"
            width={130}
            height={26}
            priority
            className="dark:hidden block"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/sign-in" className="hidden sm:block">
            <button className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up" className="hidden sm:block">
            <button className="rounded-xl bg-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
              Get Started
            </button>
          </Link>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen ? (
        <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
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
            <div className="mt-2 flex gap-3 border-t border-[var(--border)] pt-4">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full rounded-xl bg-[var(--accent-cyan)] px-4 py-2.5 text-sm font-medium text-white">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}