import { auth, currentUser } from "@clerk/nextjs/server";
import type { AnyDb } from "../orders/common";
import { ensureProfile, type AuthedUser } from "../customers/profile";

/**
 * The ONLY place the customer's identity enters the system for API calls: Clerk's
 * verified session. Nothing from the request body, query string or headers is ever
 * used to decide who the customer is.
 *
 * Returns null when signed out (the API then answers 401).
 * Requires clerkMiddleware to have run for the request (see middleware.ts).
 */
export async function clerkAuthenticate(_req: Request, db: AnyDb): Promise<AuthedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  return ensureProfile(db, userId, async () => {
    // Only reached the first time this customer is seen and the webhook hasn't synced yet.
    const user = await currentUser();
    const email = (user?.primaryEmailAddress ?? user?.emailAddresses?.[0])?.emailAddress;
    if (!email) {
      // Configure Clerk to require an email address at sign-up.
      throw new Error("Clerk user has no email address");
    }
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return { email: email.toLowerCase(), name: name || null };
  });
}
