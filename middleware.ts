import { clerkMiddleware } from "@clerk/nextjs/server";

// Minimal middleware — just let Clerk handle auth
// No custom role logic in middleware (causes MIDDLEWARE_INVOCATION_FAILED on Vercel)
// Role enforcement is handled at page level via currentUser() and API level via auth()
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next|_clerk).*)", "/(api|trpc)(.*)"],
};
