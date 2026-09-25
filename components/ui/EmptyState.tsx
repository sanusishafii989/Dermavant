import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={twMerge("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center animate-in fade-in-50", className)}>
      {icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-muted mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-secondary max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
