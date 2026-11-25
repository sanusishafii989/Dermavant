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
          "flex h-10 w-full rounded-xl border bg-input px-3.5 py-2 text-sm text-primary placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cyan/25 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger focus:border-danger focus:ring-danger/25" : "border-border focus:border-accent-cyan",
          className
        )}
        {...props}
      />
      {error ? <p className="text-sm font-medium text-danger-text">{error}</p> : null}
    </div>
  );
}
