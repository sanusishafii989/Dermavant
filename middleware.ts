import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Pass an empty async handler — clerkMiddleware() with no args may not be valid
export default clerkMiddleware(async () => {
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next|_clerk).*)", "/(api|trpc)(.*)"],
};
