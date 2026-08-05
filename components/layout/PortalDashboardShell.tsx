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
        footer={
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserButton />
          </div>
        }
      />
      {/* pt-16 on mobile to account for the top bar, md:pt-0 for desktop */}
      <main className="flex-1 overflow-auto p-4 pt-20 md:p-6 md:pt-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}