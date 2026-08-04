import { doctorNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function DoctorProfilePage() {
  return (
    <PlaceholderPage
      title="Profile"
      description="Doctor profile management will be enabled here soon."
      links={doctorNavLinks}
    />
  );
}
