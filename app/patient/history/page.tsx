import { patientNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PatientHistoryPage() {
  return (
    <PlaceholderPage
      title="Medical History"
      description="Medical history summaries and records will appear here once connected."
      links={patientNavLinks}
    />
  );
}
