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
  mobileHeaderActions?: ReactNode;
  className?: string;
}

export function Sidebar({ links, title = "Dermavant", footer, mobileHeaderActions, className }: SidebarProps) {
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
            ? "bg-accent-cyan/15 text-accent-cyan"
            : "text-secondary hover:bg-surface-elevated hover:text-primary"
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
            alt="Dermavant"
            width={130}
            height={26}
            priority
            className="dark:block hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Dermavant"
            width={130}
            height={26}
            priority
            className="dark:hidden block"
          />
        </>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/15 text-accent-cyan">
          <svg viewBox="0 0 48 48" className="h-6 w-6">
            <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <rect x="17" y="14" width="14" height="20" rx="2" fill="currentColor" />
            <rect x="10" y="21" width="28" height="6" rx="2" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );

  const footerSection = footer ? (
    <div className="mt-auto space-y-3 border-t border-border pt-4">
      <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>{footer}</div>
      <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-end")}>
        <ThemeToggle />
      </div>
    </div>
  ) : (
    <div className="mt-auto border-t border-border pt-4">
      <ThemeToggle />
    </div>
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Keep the dock focused on the most common actions. Everything else remains
  // one tap away in the full-screen menu.
  const primaryMobileLinks = links.slice(0, 4);

  // Mobile: drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile app bar */}
        <header className="fixed left-0 right-0 top-0 z-40 flex min-h-[4.5rem] items-center justify-between border-b border-border bg-background/90 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-secondary active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 px-3">
            <p className="truncate text-sm font-semibold text-primary">{title}</p>
            <p className="text-[11px] font-medium text-accent-cyan">Dermavant</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {mobileHeaderActions}
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[min(19rem,86vw)] flex-col border-r border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-left">
              <div className="mb-6 flex items-center justify-between">
                <Image
                  src="/logo.svg"
                  alt="Dermavant"
                  width={130}
                  height={26}
                  priority
                  className="dark:block hidden"
                />
                <Image
                  src="/logo-light.svg"
                  alt="Dermavant"
                  width={130}
                  height={26}
                  priority
                  className="dark:hidden block"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface-elevated"
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

        <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden">
          {primaryMobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium transition-colors",
                isActive(link.href)
                  ? "bg-accent-cyan/12 text-accent-cyan"
                  : "text-muted active:bg-surface-elevated"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center">{link.icon}</span>
              <span className="max-w-full truncate px-1">{link.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium text-muted active:bg-surface-elevated"
            aria-label="Open more navigation options"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </nav>
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
          "mb-2 flex items-center justify-center rounded-lg border border-border py-2 text-secondary transition-colors hover:bg-surface-elevated hover:text-accent-cyan",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      {footerSection}
    </aside>
  );
}
