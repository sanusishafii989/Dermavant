import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getRoleFromClaims,
  isUserRole,
  ROLE_DASHBOARD,
  type UserRole,
} from "@/lib/roles";

async function resolveUserRole(
  userId: string | null | undefined,
  sessionClaims: Record<string, unknown> | null | undefined
): Promise<UserRole | null> {
  const roleFromClaims = getRoleFromClaims(sessionClaims);
  if (roleFromClaims) {
    return roleFromClaims;
  }

  if (!userId) {
    return null;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const publicRole = (user as any).publicMetadata?.role;
    if (isUserRole(publicRole)) {
      return publicRole as any;
    }
    const unsafeRole = (user as any).unsafeMetadata?.role;
    if (isUserRole(unsafeRole)) {
      return unsafeRole as any;
    }
    const public_metadata = (user as any).public_metadata?.role;
    if (isUserRole(public_metadata)) {
      return public_metadata as any;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MIDDLEWARE] Failed to resolve Clerk user role:", error);
    }
  }

  return null;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/dev(.*)",
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

  const isPublicRequest = isPublicRoute(req);
  if (isPublicRequest) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  const userRole = await resolveUserRole(
    userId,
    sessionClaims as Record<string, unknown> | null | undefined
  );

  if (process.env.NODE_ENV !== "production") {
    console.log("[MIDDLEWARE AUTH]", {
      pathname,
      userId,
      userRole,
      sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : null,
      publicMetadata: sessionClaims?.publicMetadata,
      metadata: sessionClaims?.metadata,
      public_metadata: sessionClaims?.public_metadata,
    });
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

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!userRole) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.redirect(new URL("/", req.url));
  }

  if (userRole === requiredRole) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (ROLE_DASHBOARD[userRole]) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[userRole], req.url));
  }

  return redirectToSignIn({ returnBackUrl: req.url });
});

export const config = {
  matcher: [
    "/((?!_next|_clerk|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
