import { twMerge } from "tailwind-merge";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={twMerge("animate-pulse rounded-md bg-disabled/50", className)}
    />
  );
}
