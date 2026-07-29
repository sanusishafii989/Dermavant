import { patientNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PatientProfilePage() {
  return (
    <PlaceholderPage
      title="Profile"
      description="Patient profile management will be available here soon."
      links={patientNavLinks}
    />
  );
}
