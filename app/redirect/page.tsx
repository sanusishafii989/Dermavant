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

  const requestedRole = user.unsafeMetadata?.role;
  const requestedSelfSignupRole = SELF_SIGNUP_ROLES.includes(requestedRole as UserRole)
    ? (requestedRole as UserRole)
    : undefined;
  const publicRole = user.publicMetadata?.role;

  // A newly-created user's webhook can arrive before signup's selected role is
  // copied into publicMetadata. If that happened, the webhook's old patient
  // default must not override a valid doctor/pharmacy selection.
  const role: UserRole =
    requestedSelfSignupRole &&
    (publicRole === "patient" || !isUserRole(publicRole))
      ? requestedSelfSignupRole
      : isUserRole(publicRole)
        ? publicRole
        : requestedSelfSignupRole ?? "patient";

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role },
    unsafeMetadata: { ...user.unsafeMetadata, role: null },
  });

  redirect(ROLE_DASHBOARD[role]);
}
