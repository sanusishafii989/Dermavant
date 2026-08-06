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
        onClick ? "cursor-pointer hover:border-cyan/40" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/60">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-white/50">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan border border-cyan/20">
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
