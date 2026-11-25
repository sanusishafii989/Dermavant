import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] shadow-sm",
  secondary: "bg-surface text-primary border border-border hover:border-[var(--border-hover)] hover:bg-surface-elevated",
  ghost: "bg-transparent text-secondary hover:bg-surface-elevated hover:text-primary",
  gold: "bg-accent-gold text-white hover:opacity-90 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...props,
      className: cn(buttonClassName, child.props.className),
    });
  }

  return <button type={type} className={buttonClassName} {...props}>{children}</button>;
}
