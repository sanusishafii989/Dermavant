"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, Shield } from "lucide-react";

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  onItemClick?: () => void;
}

export function Sidebar({
  links,
  title = "Aetheris Health",
  footer,
  className,
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
  onItemClick,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass-panel relative flex h-full min-h-screen flex-col border-r border-white/10 p-4 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-2">
        {!isCollapsed ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan">
              Portal
            </p>
            <h1 className="mt-0.5 text-base font-bold text-white truncate max-w-[170px]">
              {title}
            </h1>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/20 border border-cyan/40 text-cyan font-bold">
            A
          </div>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Desktop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors",
              isCollapsed && "mx-auto mt-2"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onItemClick}
              title={isCollapsed ? link.label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                isActive
                  ? "bg-cyan/15 text-cyan border-l-2 border-cyan shadow-sm shadow-cyan/10"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {link.icon ? (
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
                    isActive ? "text-cyan" : "text-white/60 group-hover:text-white"
                  )}
                >
                  {link.icon}
                </span>
              ) : (
                <Shield className="h-4 w-4 shrink-0 text-white/60" />
              )}

              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {footer ? (
        <div className="mt-auto border-t border-white/10 pt-4">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

