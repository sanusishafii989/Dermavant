"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
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
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass-panel flex h-full min-h-screen w-64 shrink-0 flex-col p-4",
        className
      )}
    >
      <div className="mb-8 px-2">
        <Image
          src="/logo.svg"
          alt="Aetheris Health"
          width={140}
          height={28}
          priority
          className="dark:block hidden"
        />
        <Image
          src="/logo-light.svg"
          alt="Aetheris Health"
          width={140}
          height={28}
          priority
          className="dark:hidden block"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
              )}
            >
              {link.icon ? (
                <span className="flex h-5 w-5 items-center justify-center">{link.icon}</span>
              ) : null}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {footer ? (
        <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2">{footer}</div>
          <ThemeToggle />
        </div>
      ) : (
        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <ThemeToggle />
        </div>
      )}
    </aside>
  );
}