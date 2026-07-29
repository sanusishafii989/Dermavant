import { patientNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PatientConsultationPage() {
  return (
    <PlaceholderPage
      title="Consultation"
      description="This section will let patients begin and manage consultations once built."
      links={patientNavLinks}
    />
  );
}
