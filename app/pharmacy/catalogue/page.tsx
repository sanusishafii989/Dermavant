import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PharmacyCatalogue } from "@/components/pharmacy/PharmacyCatalogue";
import { connectDB } from "@/lib/db";
import { Partner, User } from "@/models";

export const dynamic = "force-dynamic";

export default async function PharmacyCataloguePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  await connectDB();
  const userDoc = await User.findOne({ clerkId: user.id }).lean();
  const partner = userDoc ? await Partner.findOne({ email: userDoc.email }).lean() : null;
  const isVerified = partner?.status === "verified";

  return (
    <PortalDashboardShell title="Medicine Catalogue" links={pharmacyNavLinks}>
      {!isVerified ? (
        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Your pharmacy is pending verification. Medicines you add will not be visible to patients until an admin verifies your profile.
          Visit the <a href="/pharmacy/kyc" className="underline">Verification page</a> to submit your credentials.
        </div>
      ) : null}
      <PharmacyCatalogue />
    </PortalDashboardShell>
  );
}
