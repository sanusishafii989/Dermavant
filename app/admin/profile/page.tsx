import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { adminNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Admin";
  const email =
    user?.emailAddresses?.[0]?.emailAddress ?? "—";

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={user?.imageUrl} name={fullName} size="lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Admin profile</p>
              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{fullName}</h1>
              <Badge variant="gold" className="mt-2">
                admin
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Account details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" defaultValue={fullName} readOnly />
            <Input label="Email" defaultValue={email} readOnly />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Contact a super-admin if you need to update your account information or permissions.
          </p>
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
