import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={twMerge("flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8", className)}>
      <div className="flex-1 space-y-1">
        {badge}
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-secondary max-w-2xl">
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
