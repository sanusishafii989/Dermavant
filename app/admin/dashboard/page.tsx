import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { adminNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Admin";

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <Card className="max-w-3xl">
        <div className="flex items-center gap-4">
          <Avatar src={user?.imageUrl} name={fullName} size="lg" />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{fullName}</h1>
            <Badge variant="gold" className="mt-2">
              admin
            </Badge>
          </div>
        </div>
        <p className="mt-6 text-white/70">
          Your admin dashboard shell is ready. User management, support, and audit tools
          will be wired in upcoming tasks.
        </p>
      </Card>
    </PortalDashboardShell>
  );
}
