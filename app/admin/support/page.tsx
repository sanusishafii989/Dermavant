import { adminNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <PlaceholderPage
      title="Support"
      description="Admin support tools will be built here in a later iteration."
      links={adminNavLinks}
    />
  );
}
