import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { orderItems, orders, payments, shipments, shipmentTrackingEvents } from "../db/schema";
import type { AnyDb } from "../orders/common";
import { verifyCheckoutSignature } from "../payments/signature";
import { CustomerError } from "./errors";

/**
 * Customer-facing order view. Explicit column list on purpose: admin_note and
 * attention_reason (refund flags etc.) must never reach a customer, and listing columns
 * means a future internal column isn't exposed by accident.
 */
const orderColumns = {
  id: orders.id,
  orderNumber: orders.orderNumber,
  status: orders.status,
  subtotalPaise: orders.subtotalPaise,
  discountPaise: orders.discountPaise,
  shippingPaise: orders.shippingPaise,
  totalPaise: orders.totalPaise,
  shippingAddress: orders.shippingAddress,
  customerNote: orders.customerNote,
  expiresAt: orders.expiresAt,
  createdAt: orders.createdAt,
};

const mine = (profileId: string, orderId: string) => and(eq(orders.id, orderId), eq(orders.profileId, profileId));

async function attachDetails(db: AnyDb, order: { id: string }) {
  const items = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      variantLabel: orderItems.variantLabel,
      sku: orderItems.sku,
      unitPricePaise: orderItems.unitPricePaise,
      quantity: orderItems.quantity,
      lineTotalPaise: orderItems.lineTotalPaise,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const ships = await db
    .select({
      id: shipments.id,
      courierName: shipments.courierName,
      awb: shipments.awb,
      trackingUrl: shipments.trackingUrl,
      status: shipments.status,
      shippedAt: shipments.shippedAt,
      deliveredAt: shipments.deliveredAt,
    })
    .from(shipments)
    .where(eq(shipments.orderId, order.id))
    .orderBy(desc(shipments.createdAt));

  const events = ships.length > 0
    ? await db
        .select({
          id: shipmentTrackingEvents.id,
          shipmentId: shipmentTrackingEvents.shipmentId,
          status: shipmentTrackingEvents.status,
          description: shipmentTrackingEvents.description,
          location: shipmentTrackingEvents.location,
          occurredAt: shipmentTrackingEvents.occurredAt,
        })
        .from(shipmentTrackingEvents)
        .where(inArray(shipmentTrackingEvents.shipmentId, ships.map((s) => s.id)))
        .orderBy(asc(shipmentTrackingEvents.occurredAt))
    : [];

  return {
    items,
    shipments: ships.map((s) => ({
      ...s,
      events: events.filter((e) => e.shipmentId === s.id),
    })),
  };
}

export async function listMyOrders(db: AnyDb, profileId: string, opts: { limit?: number; offset?: number } = {}) {
  return db
    .select(orderColumns)
    .from(orders)
    .where(eq(orders.profileId, profileId))
    .orderBy(desc(orders.createdAt))
    .limit(Math.min(opts.limit ?? 20, 50))
    .offset(opts.offset ?? 0);
}

export async function getMyOrder(db: AnyDb, profileId: string, orderId: string) {
  const [order] = await db.select(orderColumns).from(orders).where(mine(profileId, orderId));
  if (!order) throw new CustomerError("ORDER_NOT_FOUND", "Order not found.");
  return { ...order, ...(await attachDetails(db, order)) };
}

export type CallbackResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  /** true while the signed callback is verified but the webhook has not confirmed payment yet */
  awaitingConfirmation: boolean;
};

export class InvalidSignatureError extends Error {}

/**
 * Browser callback after Razorpay Checkout. This does NOT mark anything paid.
 * Payment truth comes only from the signed webhook. What this does:
 *
 *  1. Ownership first: the Razorpay order must belong to the signed-in customer, else
 *     404 (a stranger learns nothing, not even whether the order exists).
 *  2. Verify Razorpay's signature (HMAC of order_id|payment_id with the key secret).
 *     Invalid -> reject, change nothing.
 *  3. If valid and the order is still pending, push expires_at out so the cron doesn't
 *     cancel an order that is genuinely paid while the webhook is in flight. GREATEST
 *     means this can only lengthen the hold, never shorten it. Even if the cron wins
 *     the race, the late-payment path in the webhook handles it.
 *  4. Report the current status; the client then polls GET /api/me/orders/:id.
 */
export async function verifyCheckoutCallback(
  db: AnyDb,
  profileId: string,
  cb: { razorpayOrderId: string; razorpayPaymentId: string; signature: string },
  keySecret: string,
  opts: { now?: Date; holdMinutes?: number } = {},
): Promise<CallbackResult> {
  const [row] = await db
    .select({ orderId: orders.id })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(and(eq(payments.razorpayOrderId, cb.razorpayOrderId), eq(orders.profileId, profileId)));
  if (!row) throw new CustomerError("ORDER_NOT_FOUND", "Order not found.");

  const valid = await verifyCheckoutSignature(
    { razorpayOrderId: cb.razorpayOrderId, razorpayPaymentId: cb.razorpayPaymentId, signature: cb.signature },
    keySecret,
  );
  if (!valid) throw new InvalidSignatureError("Payment signature could not be verified.");

  const holdUntil = new Date((opts.now ?? new Date()).getTime() + (opts.holdMinutes ?? 30) * 60_000).toISOString();
  await db
    .update(orders)
    .set({ expiresAt: sql`GREATEST(${orders.expiresAt}, ${holdUntil}::timestamptz)` })
    .where(and(eq(orders.id, row.orderId), eq(orders.status, "pending_payment")));

  const [o] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status })
    .from(orders)
    .where(eq(orders.id, row.orderId));
  return { orderId: o.id, orderNumber: o.orderNumber, status: o.status, awaitingConfirmation: o.status === "pending_payment" };
}
