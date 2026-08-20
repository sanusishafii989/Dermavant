import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromClaims, isUserRole, ROLE_DASHBOARD, type UserRole } from "@/lib/roles";

const isPublicRoute = createRouteMatcher([
  "/(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/patient/(.*)",
  "/doctor/(.*)",
  "/pharmacy/(.*)",
  "/admin/(.*)",
  "/api/patient/(.*)",
  "/api/doctor/(.*)",
  "/api/pharmacy/(.*)",
  "/api/admin/(.*)",
]);

function getRequiredRole(pathname: string): UserRole | null {
  const p = pathname.toLowerCase();
  if (p.startsWith("/patient")) return "patient";
  if (p.startsWith("/doctor")) return "doctor";
  if (p.startsWith("/pharmacy")) return "partner";
  if (p.startsWith("/admin")) return "admin";
  return null;
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Only check protected routes
  if (!isProtectedRoute(req)) {
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
