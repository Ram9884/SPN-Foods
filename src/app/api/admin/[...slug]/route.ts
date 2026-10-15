import { auth, currentUser } from "@clerk/nextjs/server";
import { dispatchAdminRequest } from "@/lib/api/admin-router";
import { json } from "@/lib/api/http";
import type { ApiDeps } from "@/lib/api/customer-api";
import { ensureProfile } from "@/lib/customers/profile";
import { getTxDb } from "@/lib/db";
import { r2Storage } from "@/lib/storage/storage";

export const dynamic = "force-dynamic";

function getDeps(req: Request): ApiDeps {
  const databaseUrl = process.env.DATABASE_URL!;
  const allowedOrigins = process.env.APP_ORIGINS ? process.env.APP_ORIGINS.split(",").map((s) => s.trim()) : undefined;

  // Cloudflare R2 bucket binding or S3/compatible client fallback
  const r2Bucket = (process.env as any).SPN_IMAGES;
  const storage = r2Bucket ? r2Storage(r2Bucket) : undefined;

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
      // In dev or test environments, allow x-test-user header
      const testUser = _req.headers.get("x-test-user");
      if (testUser && process.env.NODE_ENV !== "production") {
        return ensureProfile(db, testUser, async () => ({
          email: `${testUser}@example.com`,
          name: testUser,
        }));
      }

      // In local dev without live Clerk keys, use dev-admin profile
      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NODE_ENV !== "production") {
        const p = await ensureProfile(db, "dev-admin", async () => ({
          email: "admin@spnfoods.local",
          name: "SPN Store Admin",
        }));
        if (p) {
          // Ensure role is admin
          const { eq } = await import("drizzle-orm");
          const { profiles } = await import("@/lib/db/schema");
          await db.update(profiles).set({ role: "admin" }).where(eq(profiles.id, p.profileId));
          p.role = "admin";
        }
        return p;
      }

      try {
        const { userId } = await auth();
        if (!userId) return null;
        return ensureProfile(db, userId, async () => {
          const u = await currentUser();
          const email = u?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.user`;
          const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null;
          return { email, name };
        });
      } catch {
        return null;
      }
    },
    gateway: {
      createOrder: async () => {
        throw new Error("Razorpay not used in admin routes");
      },
    },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    allowedOrigins,
    storage,
    imageBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    log: (msg, extra) => console.error(msg, extra),
  };
}

import { revalidatePath } from "next/cache";

async function handle(req: Request) {
  const deps = getDeps(req);
  const res = await dispatchAdminRequest(req, deps);
  if (!res) {
    return json(404, { error: { code: "NOT_FOUND", message: "Admin endpoint not found." } });
  }

  // On successful database mutations (POST, PATCH, DELETE), invalidate the storefront cache
  // so updates to products, variants, categories, and settings propagate immediately to customers
  if (req.method !== "GET" && res.status >= 200 && res.status < 300) {
    try {
      revalidatePath("/", "layout");
    } catch {
      // In standalone scripts or unit tests, safely continue
    }
  }

  return res;
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function PATCH(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}
