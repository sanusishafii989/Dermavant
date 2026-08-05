import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationBellProps {
  count?: number;
  className?: string;
}

export function NotificationBell({ count = 0, className }: NotificationBellProps) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]",
        className
      )}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}