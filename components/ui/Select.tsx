import { SelectHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        className={twMerge(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger focus:ring-danger" : "border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";
