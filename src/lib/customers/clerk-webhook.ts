import type { AnyDb } from "../orders/common";
import { verifySvixSignature } from "../payments/signature";
import { markProfileDeleted, recordClerkEvent, upsertProfileFromClerk, type ClerkUserInfo } from "./profile";

export type ClerkWebhookDeps = {
  secret: string;
  withDb: <T>(fn: (db: AnyDb) => Promise<T>) => Promise<T>;
  nowSeconds?: number;
  log?: (msg: string, extra?: Record<string, unknown>) => void;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function userInfoFromClerkPayload(data: any): ClerkUserInfo | null {
  const emails: { id: string; email_address: string }[] = Array.isArray(data?.email_addresses) ? data.email_addresses : [];
  const primary = emails.find((e) => e.id === data?.primary_email_address_id) ?? emails[0];
  if (!primary?.email_address) return null;
  const name = [data?.first_name, data?.last_name].filter((x) => typeof x === "string" && x.trim()).join(" ").trim();
  return { email: String(primary.email_address).toLowerCase(), name: name || null };
}

/**
 * Keeps local profiles in step with Clerk. Verified with Svix, deduplicated by svix-id.
 * Profile creation also happens lazily on a customer's first request, so a missed or
 * late webhook never locks anyone out; this endpoint just keeps email/name fresh and
 * handles deletion. Runs in a transaction with the dedupe row so a failure is retried.
 */
export async function handleClerkWebhook(req: Request, deps: ClerkWebhookDeps): Promise<Response> {
  const log = deps.log ?? ((m, e) => console.error(m, e));
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const raw = await req.text();
  if (raw.length > 256 * 1024) return json(413, { error: "payload_too_large" });

  const ok = await verifySvixSignature(
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signatureHeader: req.headers.get("svix-signature"),
      rawBody: raw,
    },
    deps.secret,
    { nowSeconds: deps.nowSeconds },
  );
  if (!ok) {
    log("clerk webhook: invalid signature");
    return json(400, { error: "invalid_signature" });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const eventId = req.headers.get("svix-id")!;
  const type: string = typeof event?.type === "string" ? event.type : "";
  const data = event?.data;

  try {
    const outcome = await deps.withDb((db) =>
      db.transaction(async (tx) => {
        if (!(await recordClerkEvent(tx, eventId, type, event))) return "duplicate";

        if ((type === "user.created" || type === "user.updated") && typeof data?.id === "string") {
          const info = userInfoFromClerkPayload(data);
          if (!info) return "skipped_no_email";
          await upsertProfileFromClerk(tx, data.id, info);
          return "synced";
        }
        if (type === "user.deleted" && typeof data?.id === "string") {
          await markProfileDeleted(tx, data.id);
          return "deleted";
        }
        return "ignored";
      }),
    );
    return json(200, { status: outcome });
  } catch (err) {
    log("clerk webhook: processing failed", { eventId, type, error: err instanceof Error ? err.message : String(err) });
    return json(500, { error: "processing_failed" });
  }
}
