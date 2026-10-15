import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk must run on every request that calls auth(). Pages that need a signed-in customer
 * redirect to sign-in here. API routes are deliberately NOT protected here: each handler
 * authenticates itself and answers JSON 401, which a fetch() caller can handle (a redirect
 * to an HTML sign-in page cannot). The two webhooks authenticate by signature instead.
 */
const needsSignIn = createRouteMatcher(["/account(.*)", "/checkout(.*)", "/orders(.*)", "/profile(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (needsSignIn(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
