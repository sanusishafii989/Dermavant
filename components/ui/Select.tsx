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
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-input text-primary px-3 py-2 text-sm transition-colors placeholder:text-muted focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/25 disabled:cursor-not-allowed disabled:opacity-50",
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
