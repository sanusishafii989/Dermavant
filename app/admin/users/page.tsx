import { adminNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      title="Users"
      description="Admin user management will be available once this portal is extended."
      links={adminNavLinks}
    />
  );
}
