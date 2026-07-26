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
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:border-cyan/30 hover:text-white",
        className
      )}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-dark">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}
