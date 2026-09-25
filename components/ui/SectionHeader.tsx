import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={twMerge("flex flex-row items-center justify-between gap-4 mb-4", className)}>
      <div className="flex-1 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
