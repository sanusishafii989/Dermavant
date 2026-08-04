export type UserRole = "patient" | "doctor" | "partner" | "admin";

export const USER_ROLES: UserRole[] = [
  "patient",
  "doctor",
  "partner",
  "admin",
];

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  partner: "/pharmacy/dashboard",
  admin: "/admin/dashboard",
};

export const PORTAL_LABELS: Record<UserRole, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  partner: "Partner Portal",
  admin: "Admin Portal",
};

export function isUserRole(value: string | undefined | null): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function getRoleFromClaims(
  claims: Record<string, unknown> | null | undefined
): UserRole | null {
  if (!claims) return null;

  const metadata = claims.metadata as { role?: string } | undefined;
  if (isUserRole(metadata?.role)) return metadata.role;

  const publicMetadata = claims.publicMetadata as { role?: string } | undefined;
  if (isUserRole(publicMetadata?.role)) return publicMetadata.role;

  const public_metadata = claims.public_metadata as { role?: string } | undefined;
  if (isUserRole(public_metadata?.role)) return public_metadata.role;

  const directRole = claims.role as string | undefined;
  if (isUserRole(directRole)) return directRole;

  const userRole = claims.user_role as string | undefined;
  if (isUserRole(userRole)) return userRole;

  return null;
}
