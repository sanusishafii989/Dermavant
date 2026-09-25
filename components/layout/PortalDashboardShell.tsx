import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";

export interface PortalDashboardShellProps {
  title: string;
  links: SidebarLink[];
  children: ReactNode;
  primaryAction?: ReactNode;
}

export function PortalDashboardShell({
  title,
  links,
  children,
  primaryAction,
}: PortalDashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-primary">
      <Sidebar
        title={title}
        links={links}
        mobileHeaderActions={
          <>
            {primaryAction}
            <NotificationBell />
            <UserButton />
          </>
        }
        footer={
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserButton />
          </div>
        }
      />
      <main className="portal-main flex-1 overflow-auto p-4 pt-[calc(5.25rem+env(safe-area-inset-top))] md:p-6 md:pt-6 lg:p-8 relative">
        {children}
        {primaryAction && (
          <div className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 left-4 z-30 flex justify-end pb-2">
             <div className="w-full flex shadow-lg rounded-xl">
                 {primaryAction}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
