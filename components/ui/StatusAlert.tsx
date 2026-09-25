import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type AlertVariant = "success" | "warning" | "danger" | "info";

export interface StatusAlertProps {
  title: string;
  description?: ReactNode;
  variant?: AlertVariant;
  className?: string;
  onDismiss?: () => void;
}

export function StatusAlert({ title, description, variant = "info", className, onDismiss }: StatusAlertProps) {
  const Icon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    info: Info,
  }[variant];

  const variantStyles = {
    success: "bg-success-bg text-success-text border-success-text/20",
    warning: "bg-warning-bg text-warning-text border-warning-text/20",
    danger: "bg-danger-bg text-danger-text border-danger-text/20",
    info: "bg-info-bg text-info-text border-info-text/20",
  }[variant];

  const iconStyles = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  }[variant];

  return (
    <div className={twMerge("relative w-full rounded-lg border p-4 flex gap-3", variantStyles, className)}>
      <Icon className={twMerge("h-5 w-5 shrink-0", iconStyles)} />
      <div className="flex-1">
        <h5 className="font-medium leading-none tracking-tight">{title}</h5>
        {description && (
          <div className="mt-2 text-sm leading-relaxed opacity-90">
            {description}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close alert</span>
        </button>
      )}
    </div>
  );
}
