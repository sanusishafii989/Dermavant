import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-primary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger focus:ring-danger" : "border-border",
          className
        )}
        {...props}
      />
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}