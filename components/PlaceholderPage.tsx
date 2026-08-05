import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { SidebarLink } from "@/components/ui/Sidebar";

interface PlaceholderPageProps {
  title: string;
  description: string;
  links: SidebarLink[];
}

export function PlaceholderPage({ title, description, links }: PlaceholderPageProps) {
  return (
    <PortalDashboardShell title={title} links={links}>
      <Card className="max-w-3xl">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Coming soon</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="text-[var(--text-secondary)]">{description}</p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-4 text-sm text-[var(--text-secondary)]">
            This section is not built yet. We will wire it into the portal in a future step.
          </div>
        </div>
      </Card>
    </PortalDashboardShell>
  );
}