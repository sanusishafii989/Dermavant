"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { Menu, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export interface SidebarLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface SidebarProps {
  links: SidebarLink[];
  title?: string;
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ links, title = "Aetheris Health", footer, className }: SidebarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  const navLinks = links.map((link) => {
    const isActive = pathname === link.href || !!pathname?.startsWith(`${link.href}/`);
    return (
      <Link
        key={link.href}
        href={link.href}
        title={collapsed ? link.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
        )}
      >
        {link.icon ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">{link.icon}</span>
        ) : null}
        {!collapsed && <span className="truncate">{link.label}</span>}
      </Link>
    );
  });

  const logoSection = (
    <div className={cn("mb-8 px-2 flex items-center justify-between", collapsed && "justify-center px-0")}>
      {!collapsed ? (
        <>
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
        </>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-cyan)]/15">
          <svg viewBox="0 0 48 48" className="h-6 w-6">
            <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinejoin="round" />
            <rect x="17" y="14" width="14" height="20" rx="2" fill="var(--accent-cyan)" />
            <rect x="10" y="21" width="28" height="6" rx="2" fill="var(--accent-cyan)" />
          </svg>
        </div>
      )}
    </div>
  );

  const footerSection = footer ? (
    <div className="mt-auto space-y-3 border-t border-[var(--border)] pt-4">
      <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>{footer}</div>
      <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-end")}>
        <ThemeToggle />
      </div>
    </div>
  ) : (
    <div className="mt-auto border-t border-[var(--border)] pt-4">
      <ThemeToggle />
    </div>
  );

  // Mobile: drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)]/90 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/logo.svg"
            alt="Aetheris Health"
            width={100}
            height={20}
            priority
            className="dark:block hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Aetheris Health"
            width={100}
            height={20}
            priority
            className="dark:hidden block"
          />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="glass-panel absolute left-0 top-0 flex h-full w-72 flex-col p-4 animate-in slide-in-from-left">
              <div className="mb-6 flex items-center justify-between">
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
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {navLinks}
              </nav>
              {footerSection}
            </aside>
          </div>
        ) : null}
      </>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <aside
      className={cn(
        "glass-panel sticky top-0 flex h-screen shrink-0 flex-col p-4 transition-all duration-200",
        sidebarWidth,
        className
      )}
    >
      {logoSection}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navLinks}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "mb-2 flex items-center justify-center rounded-lg border border-[var(--border)] py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] hover:text-[var(--accent-cyan)]",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      {footerSection}
    </aside>
  );
}