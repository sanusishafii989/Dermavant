"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  badgeText?: string;
  badgeVariant?: "default" | "cyan" | "gold" | "success" | "warning" | "danger";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeVariant = "cyan",
  onClick,
}: StatCardProps) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={`relative overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-[var(--border-hover)]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-primary tracking-tight tabular-nums">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-secondary">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
            {icon}
          </div>
        )}
      </div>
      {badgeText && (
        <div className="mt-4 flex items-center gap-2">
          <Badge variant={badgeVariant}>{badgeText}</Badge>
        </div>
      )}
    </Card>
  );
}
