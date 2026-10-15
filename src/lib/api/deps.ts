import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb, getTxDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/customers/profile";
import { razorpayGateway } from "@/lib/payments/razorpay";
import type { PublicDeps } from "@/lib/api/public-api";
import type { ApiDeps } from "@/lib/api/customer-api";

export function getPublicDeps(): PublicDeps {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }
  return {
    withDb: async (fn) => fn(getDb(databaseUrl)),
    imageBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    log: (msg, extra) => console.error(msg, extra),
  };
}

export function getCustomerDeps(req: Request): ApiDeps {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }

  const allowedOrigins = process.env.APP_ORIGINS
    ? process.env.APP_ORIGINS.split(",").map((s) => s.trim())
    : undefined;

  const razorpayKeyId = (
    process.env.RAZORPAY_KEY_ID ??
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ??
    ""
  ).trim();
  const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET ?? "").trim();
  const gateway = razorpayGateway(razorpayKeyId, razorpayKeySecret);

  return {
    withDb: async (fn) => {
      const { db, close } = getTxDb(databaseUrl);
      try {
        return await fn(db);
      } finally {
        await close();
      }
    },
    authenticate: async (_req, db) => {
      // In dev or test environments, allow x-test-user header or fallback dev-customer when Clerk keys are not yet configured
      const testUser = _req.headers.get("x-test-user");
      if (testUser && process.env.NODE_ENV !== "production") {
        return ensureProfile(db, testUser, async () => ({
          email: `${testUser}@example.com`,
          name: testUser,
        }));
      }

      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NODE_ENV !== "production") {
        const p = await ensureProfile(db, "dev-customer", async () => ({
          email: "spnhealthmix@gmail.com",
          name: "Sai Saran",
          phone: "7094938940",
        }));
        if (p) {
          await db
            .update(profiles)
            .set({
              email: "spnhealthmix@gmail.com",
              name: "Sai Saran",
              phone: "7094938940",
            })
            .where(eq(profiles.id, p.profileId));
        }
        return p;
      }

      // Check Clerk authentication
      try {
        const { userId } = await auth();
        if (!userId) return null;
        return ensureProfile(db, userId, async () => {
          const u = await currentUser();
          const email =
            u?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.user`;
          const name =
            [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null;
          return { email, name };
        });
      } catch {
        return null;
      }
    },
    gateway,
    razorpayKeyId,
    razorpayKeySecret,
    allowedOrigins,
    imageBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    log: (msg, extra) => console.error(msg, extra),
  };
}
