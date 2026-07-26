"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        "glass-panel flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-white/10 p-4",
        className
      )}
    >
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">Portal</p>
        <h1 className="mt-1 text-lg font-semibold text-white">{title}</h1>
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
                  ? "bg-cyan/15 text-cyan"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
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

      {footer ? <div className="mt-auto border-t border-white/10 pt-4">{footer}</div> : null}
    </aside>
  );
}
