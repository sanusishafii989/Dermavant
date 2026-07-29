import { doctorNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function DoctorResearchChatPage() {
  return (
    <PlaceholderPage
      title="Research Chat"
      description="Doctor research chat and knowledge tools will appear here in the future."
      links={doctorNavLinks}
    />
  );
}
