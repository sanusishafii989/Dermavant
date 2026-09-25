import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface MobileListItemProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileListItem({ title, subtitle, actions, status, icon, onClick, className }: MobileListItemProps) {
  return (
    <div 
      onClick={onClick}
      className={twMerge(
        "flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm", 
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 mt-0.5 text-muted">
              {icon}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="font-medium text-primary truncate">{title}</div>
            {subtitle && (
              <div className="text-sm text-secondary mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
        </div>
        {status && (
          <div className="flex-shrink-0">
            {status}
          </div>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 pt-3 border-t border-border mt-1">
          {actions}
        </div>
      )}
    </div>
  );
}

export function MobileList({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={twMerge("flex flex-col gap-3", className)}>
      {children}
    </div>
  );
}
