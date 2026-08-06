import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { adminNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { User, Admin } from "@/models";
import { Shield, Key, Sliders, CheckCircle2, UserCheck, Mail, Phone, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const clerkUser = await currentUser();
  const fullName =
    clerkUser?.fullName ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    "Admin";
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "";

  await connectDB();

  const userDoc = await User.findOne({ clerkId: clerkUser?.id }).lean();
  let adminDoc = null;
  if (userDoc) {
    adminDoc = await Admin.findOne({ userId: userDoc._id }).lean();
  }

  const adminLevel = adminDoc?.adminLevel || "super";
  const permissions = adminDoc?.permissions?.length
    ? adminDoc.permissions
    : [
        "manage_users",
        "manage_verifications",
        "manage_support_tickets",
        "view_audit_logs",
        "view_financial_revenue",
        "system_settings_override",
      ];

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-6 max-w-4xl">
        {/* Header Banner */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Profile & System Settings</h1>
          <p className="text-sm text-white/60">
            Account identity, access privileges, and ecosystem business model configuration
          </p>
        </div>

        {/* Profile Card */}
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-white/10 pb-6">
            <Avatar src={clerkUser?.imageUrl} name={fullName} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{fullName}</h2>
                <Badge variant="gold">{adminLevel} admin</Badge>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-sm text-white/60 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-cyan" /> {email}
              </p>
              {userDoc?.phone && (
                <p className="text-xs text-white/50 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {userDoc.phone}
                </p>
              )}
            </div>
          </div>

          {/* Admin Permissions Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Granted Privilege Scope
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/5 text-xs text-white/90"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="capitalize">{perm.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Business Model Constants (Read-Only System Rules) */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-gold">
              <Sliders className="h-5 w-5" />
              <h3 className="text-lg font-bold text-white">Ecosystem Business Model Rules</h3>
            </div>
            <Badge variant="gold">Standard Policy Config</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-1">
              <span className="text-xs text-white/50 block">Clinical AI Suite Consultation Fee</span>
              <span className="text-xl font-bold text-white">₦3,000</span>
              <span className="text-[11px] text-white/40 block">Fixed platform charge per AI report</span>
            </div>

            <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-1">
              <span className="text-xs text-white/50 block">Doctor Consultation Platform Commission</span>
              <span className="text-xl font-bold text-cyan">30%</span>
              <span className="text-[11px] text-white/40 block">Deducted on video, voice & chat consultations</span>
            </div>

            <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-1">
              <span className="text-xs text-white/50 block">E-Pharmacy Partner Platform Margin</span>
              <span className="text-xl font-bold text-gold">~25%</span>
              <span className="text-[11px] text-white/40 block">Catalog fulfilment margin</span>
            </div>

            <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-1">
              <span className="text-xs text-white/50 block">Default Consultation Rates</span>
              <span className="text-sm font-semibold text-white block">Video: ₦5,000 | Voice: ₦3,000 | Chat: ₦2,000</span>
              <span className="text-[11px] text-white/40 block">Doctor baseline consultation rates</span>
            </div>
          </div>
        </Card>

        {/* Clerk Auth Integration Note */}
        <Card className="bg-white/5 border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-cyan">
            <Lock className="h-4 w-4" />
            <h4 className="text-sm font-semibold text-white">Authentication & Password Security</h4>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Admin credentials and password security are managed via Clerk Authentication. To update your password or setup Multi-Factor Authentication (MFA), manage your account through the Clerk security portal.
          </p>
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
