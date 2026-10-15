import { eq, sql } from "drizzle-orm";
import { addresses, profiles, webhookEvents } from "../db/schema";
import type { AnyDb } from "../orders/common";
import { CustomerError } from "./errors";

export type ClerkUserInfo = { email: string; name: string | null; phone?: string | null };
export type AuthedUser = { profileId: string; clerkUserId: string; role?: string };

/**
 * Create or refresh the local profile for a Clerk user. Safe to call from the Clerk
 * webhook and from the lazy path at the same time: the unique index on clerk_user_id
 * plus ON CONFLICT means exactly one row results. A deleted profile is never revived
 * or overwritten.
 */
export async function upsertProfileFromClerk(db: AnyDb, clerkUserId: string, info: ClerkUserInfo) {
  const [row] = await db
    .insert(profiles)
    .values({ clerkUserId, email: info.email, name: info.name, phone: info.phone ?? null })
    .onConflictDoUpdate({
      target: profiles.clerkUserId,
      set: {
        email: info.email,
        name: sql`coalesce(${info.name}, ${profiles.name})`,
        phone: sql`coalesce(${info.phone ?? null}, ${profiles.phone})`,
      },
      setWhere: sql`${profiles.deletedAt} IS NULL`,
    })
    .returning({ id: profiles.id, role: profiles.role, deletedAt: profiles.deletedAt });
  // setWhere failing on a deleted profile returns no row.
  return row ?? null;
}

/**
 * Resolve the authenticated Clerk user to a local profile.
 * Fast path: one indexed SELECT. Only the first request after sign-up calls Clerk
 * (via `fetchUser`) to learn the email/name; the user.created webhook usually gets
 * there first, and either way ends in the same single row.
 * Returns null for a deleted account.
 */
export async function ensureProfile(
  db: AnyDb,
  clerkUserId: string,
  fetchUser: () => Promise<ClerkUserInfo>,
): Promise<AuthedUser | null> {
  const [existing] = await db
    .select({ id: profiles.id, role: profiles.role, deletedAt: profiles.deletedAt })
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId));
  if (existing) return existing.deletedAt ? null : { profileId: existing.id, clerkUserId, role: existing.role };

  const row = await upsertProfileFromClerk(db, clerkUserId, await fetchUser());
  return row ? { profileId: row.id, clerkUserId, role: row.role } : null;
}

/**
 * Clerk user deleted. Orders must keep pointing at a profile (accounting records), so
 * the row stays but is anonymised, loses its addresses, and can never sign in again.
 * Order address snapshots are untouched: they are the shipping record.
 */
export async function markProfileDeleted(db: AnyDb, clerkUserId: string) {
  await db.transaction(async (tx) => {
    const [p] = await tx.select().from(profiles).where(eq(profiles.clerkUserId, clerkUserId)).for("update");
    if (!p || p.deletedAt) return;
    await tx.delete(addresses).where(eq(addresses.profileId, p.id));
    await tx
      .update(profiles)
      .set({ deletedAt: new Date(), name: null, phone: null, email: `deleted-${p.id}@invalid.local` })
      .where(eq(profiles.id, p.id));
  });
}

export async function getProfile(db: AnyDb, profileId: string) {
  const [p] = await db
    .select({ id: profiles.id, email: profiles.email, name: profiles.name, phone: profiles.phone, createdAt: profiles.createdAt })
    .from(profiles)
    .where(eq(profiles.id, profileId));
  if (!p) throw new CustomerError("PROFILE_NOT_FOUND", "Profile not found.");
  return p;
}

/** Email is owned by Clerk and is never writable here. Only name and phone are. */
export async function updateProfile(db: AnyDb, profileId: string, patch: { name?: string; phone?: string | null }) {
  await db.update(profiles).set(patch).where(eq(profiles.id, profileId));
  return getProfile(db, profileId);
}

/** Idempotent receipt for Clerk webhook deliveries. Returns false if already seen. */
export async function recordClerkEvent(db: AnyDb, eventId: string, eventType: string, payload: unknown) {
  const ins = await db
    .insert(webhookEvents)
    .values({ id: eventId, provider: "clerk", eventType, payload })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  return ins.length > 0;
}
