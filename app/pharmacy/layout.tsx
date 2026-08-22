import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD } from "@/lib/roles";

export default async function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole !== "partner") {
    if (userRole && ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD]) {
      redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD]);
    }
    redirect("/sign-in");
  }

  return <>{children}</>;
}
