import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getTxDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/customers/profile";

export type AdminAuthResult =
  | { authorized: true; profile: { id: string; email: string; name: string | null; role: "admin" } }
  | { authorized: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

export async function verifyAdminSession(): Promise<AdminAuthResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { authorized: false, reason: "FORBIDDEN" };
  }

  // Local development without Clerk keys configured
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NODE_ENV !== "production") {
    const { db, close } = getTxDb(databaseUrl);
    try {
      const p = await ensureProfile(db, "dev-admin", async () => ({
        email: "spnhealthmix@gmail.com",
        name: "Sai Saran (Founder & Admin)",
        phone: "7094938940",
      }));
      if (p) {
        await db
          .update(profiles)
          .set({
            role: "admin",
            email: "spnhealthmix@gmail.com",
            name: "Sai Saran (Founder & Admin)",
            phone: "7094938940",
          })
          .where(eq(profiles.id, p.profileId));
        return {
          authorized: true,
          profile: {
            id: p.profileId,
            email: "spnhealthmix@gmail.com",
            name: "Sai Saran (Founder & Admin)",
            role: "admin",
          },
        };
      }
    } finally {
      await close();
    }
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return { authorized: false, reason: "UNAUTHENTICATED" };
    }

    const { db, close } = getTxDb(databaseUrl);
    try {
      const userProfile = await ensureProfile(db, userId, async () => {
        const u = await currentUser();
        const email = u?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.user`;
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null;
        return { email, name };
      });

      if (!userProfile) {
        return { authorized: false, reason: "FORBIDDEN" };
      }

      const [p] = await db
        .select({ id: profiles.id, email: profiles.email, name: profiles.name, role: profiles.role, deletedAt: profiles.deletedAt })
        .from(profiles)
        .where(eq(profiles.id, userProfile.profileId));

      if (!p || p.role !== "admin" || p.deletedAt) {
        return { authorized: false, reason: "FORBIDDEN" };
      }

      return {
        authorized: true,
        profile: {
          id: p.id,
          email: p.email,
          name: p.name,
          role: "admin",
        },
      };
    } finally {
      await close();
    }
  } catch (err) {
    console.error("verifyAdminSession error:", err);
    return { authorized: false, reason: "UNAUTHENTICATED" };
  }
}
