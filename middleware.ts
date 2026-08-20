import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromClaims, isUserRole, ROLE_DASHBOARD, type UserRole } from "@/lib/roles";

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/patient") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/pharmacy") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/patient") ||
    pathname.startsWith("/api/doctor") ||
    pathname.startsWith("/api/pharmacy") ||
    pathname.startsWith("/api/admin");
}

function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/patient")) return "patient";
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/pharmacy")) return "partner";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const isApi = pathname.startsWith("/api/");

  if (!userId) {
    if (isApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  const role = getRoleFromClaims(sessionClaims as any);
  const required = getRequiredRole(pathname);

  if (role && isUserRole(role) && required && role !== required) {
    if (isApi) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next|_clerk).*)", "/(api|trpc)(.*)"],
};
