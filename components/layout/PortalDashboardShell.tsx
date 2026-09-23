import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Sidebar, type SidebarLink } from "@/components/ui/Sidebar";

export interface PortalDashboardShellProps {
  title: string;
  links: SidebarLink[];
  children: ReactNode;
}

export function PortalDashboardShell({
  title,
  links,
  children,
}: PortalDashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar
        title={title}
        links={links}
        mobileHeaderActions={
          <>
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
      <main className="portal-main flex-1 overflow-auto p-4 pt-[calc(5.25rem+env(safe-area-inset-top))] md:p-6 md:pt-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
