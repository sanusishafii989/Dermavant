import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, description, required, children, className }: FormFieldProps) {
  return (
    <div className={twMerge("space-y-2", className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-secondary">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
