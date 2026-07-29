import { adminNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function AdminAuditLogsPage() {
  return (
    <PlaceholderPage
      title="Audit Logs"
      description="Audit logs and system history will be surfaced here once logging is integrated."
      links={adminNavLinks}
    />
  );
}
