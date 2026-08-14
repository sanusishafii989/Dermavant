import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRoleFromClaims,
  isUserRole,
  ROLE_DASHBOARD,
  type UserRole,
} from "@/lib/roles";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/sign-in")) return true;
  if (pathname.startsWith("/sign-up")) return true;
  if (pathname.startsWith("/terms")) return true;
  if (pathname.startsWith("/privacy")) return true;
  if (pathname.startsWith("/api/webhooks")) return true;
  if (pathname.startsWith("/api/dev")) return true;
  if (pathname.startsWith("/api/contact")) return true;
  if (pathname.startsWith("/api/support")) return true;
  if (pathname.startsWith("/api/partners")) return true;
  if (pathname.startsWith("/api/doctors")) return true;
  return false;
}

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

  // Public routes — always allow
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  
  // Not a protected route — allow
  if (!requiredRole) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Not logged in — redirect to sign-in
  if (!userId) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Get role from Clerk session claims
  const userRole = getRoleFromClaims(
    sessionClaims as Record<string, unknown> | null | undefined
  );

  // If we have a confirmed role, enforce it strictly
  if (userRole && isUserRole(userRole)) {
    // Role matches — allow access
    if (userRole === requiredRole) {
      return NextResponse.next();
    }

    // Role does NOT match — block and redirect to their correct portal
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Forbidden — access denied for your role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Redirect to their own portal
    const correctDashboard = ROLE_DASHBOARD[userRole];
    return NextResponse.redirect(new URL(correctDashboard, req.url));
  }

  // No role in claims — try Clerk publicMetadata as fallback
  // This handles the case where session claims don't have the role yet
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const publicRole = (clerkUser as any).publicMetadata?.role;

    if (isUserRole(publicRole)) {
      if (publicRole === requiredRole) {
        return NextResponse.next();
      }

      if (isApiRoute) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const correctDashboard = ROLE_DASHBOARD[publicRole as UserRole];
      return NextResponse.redirect(new URL(correctDashboard, req.url));
    }
  } catch {
    // Clerk API call failed — allow through as last resort
    // API routes will still verify role independently
  }

  // No role found anywhere — allow through, API routes handle it
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|_clerk|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
