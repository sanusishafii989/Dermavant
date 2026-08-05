import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const sizePixels: Record<string, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <div className={cn("rounded-full overflow-hidden", sizeStyles[size], className)}>
        <Image
          src={src as string}
          alt={name}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 font-semibold text-[var(--accent-cyan)]",
        sizeStyles[size],
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}