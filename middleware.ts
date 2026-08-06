import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRoleFromClaims,
  isUserRole,
  ROLE_DASHBOARD,
  type UserRole,
} from "@/lib/roles";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/api/webhooks(.*)",
  "/api/dev(.*)",
  "/api/contact(.*)",
  "/api/support(.*)",
]);

function getRequiredRoleForPath(pathname: string): UserRole | null {
  const p = pathname.toLowerCase();

  if (p === "/patient" || p.startsWith("/patient/")) return "patient";
  if (p === "/doctor" || p.startsWith("/doctor/")) return "doctor";
  if (p === "/pharmacy" || p.startsWith("/pharmacy/")) return "partner";
  if (p === "/admin" || p.startsWith("/admin/")) return "admin";

  if (p === "/api/patient" || p.startsWith("/api/patient/")) return "patient";
  if (p === "/api/doctor" || p.startsWith("/api/doctor/")) return "doctor";
  if (p === "/api/pharmacy" || p.startsWith("/api/pharmacy/")) return "partner";
  if (p === "/api/admin" || p.startsWith("/api/admin/")) return "admin";

  return null;
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Try to get role from session claims first (no API call needed)
  const roleFromClaims = getRoleFromClaims(
    sessionClaims as Record<string, unknown> | null | undefined
  );

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!userId) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If we have a role from claims, use it
  if (roleFromClaims && isUserRole(roleFromClaims)) {
    if (roleFromClaims === requiredRole) {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (ROLE_DASHBOARD[roleFromClaims]) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[roleFromClaims], req.url));
    }

    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // No role in claims — allow through, API routes will handle auth
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|_clerk|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
