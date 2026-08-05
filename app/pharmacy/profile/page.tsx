import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { LocationEditor } from "@/components/location/DynamicLocationEditor";
import { connectDB } from "@/lib/db";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { Partner, User } from "@/models";

export const dynamic = "force-dynamic";

export default async function PharmacyProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user.id }).lean();
  const partner = userDoc ? await Partner.findOne({ email: userDoc.email }).lean() : null;

  const initialAddress = typeof partner?.address === "string" ? partner.address : "";
  const initialLatitude = Number(partner?.location?.coordinates?.[1] ?? partner?.latitude ?? 6.5244);
  const initialLongitude = Number(partner?.location?.coordinates?.[0] ?? partner?.longitude ?? 3.3792);

  return (
    <PortalDashboardShell title="Pharmacy Profile" links={pharmacyNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Partner profile</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Set your pharmacy location</h1>
        </div>

        <LocationEditor
          endpoint="/api/partner/location"
          title="Pharmacy location"
          description="Search by address, then fine-tune the marker by dragging it on the map. If the address does not geocode cleanly, you can still save a valid point manually."
          initialAddress={initialAddress}
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
        />
      </div>
    </PortalDashboardShell>
  );
}
