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
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserButton />
          </div>
        }
      />
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}