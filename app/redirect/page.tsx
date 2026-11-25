import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isUserRole, ROLE_DASHBOARD, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const SELF_SIGNUP_ROLES: UserRole[] = ["patient", "doctor", "partner"];

export default async function PostLoginRedirect() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const publicRole = user.publicMetadata?.role;
  if (typeof publicRole === "string" && isUserRole(publicRole)) {
    redirect(ROLE_DASHBOARD[publicRole]);
  }

  // Sign-up records the chosen role in unsafeMetadata. Copy only a permitted
  // self-signup role into trusted publicMetadata on the server. Admin is never
  // accepted from user-controlled metadata.
  const requestedRole = user.unsafeMetadata?.role;
  const role: UserRole = SELF_SIGNUP_ROLES.includes(requestedRole as UserRole)
    ? (requestedRole as UserRole)
    : "patient";

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { role },
  });

  redirect(ROLE_DASHBOARD[role]);
}
