import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRoleFromClaims,
  isUserRole,
  ROLE_DASHBOARD,
  type UserRole,
} from "@/lib/roles";

// Simple public route check without createRouteMatcher (deprecated, crashes on Vercel edge)
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

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

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

  const roleFromClaims = getRoleFromClaims(
    sessionClaims as Record<string, unknown> | null | undefined
  );

  // STRICT: If we can determine the role from claims, enforce it
  if (roleFromClaims && isUserRole(roleFromClaims)) {
    if (roleFromClaims === requiredRole) {
      return NextResponse.next();
    }

    // Role mismatch — deny access
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Forbidden — you do not have access to this portal" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Redirect to their correct portal
    if (ROLE_DASHBOARD[roleFromClaims]) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[roleFromClaims], req.url));
    }
  }

  // If no role in claims, deny access to protected routes
  // Don't fall through — require a role
  if (isApiRoute) {
    return new Response(JSON.stringify({ error: "Forbidden — role not verified" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // For pages, redirect to sign-in
  return redirectToSignIn({ returnBackUrl: req.url });
});

export const config = {
  matcher: [
    "/((?!_next|_clerk|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
