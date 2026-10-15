import { createHmac } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  acall,
  addAddress,
  call,
  checkout,
  db,
  fillCart,
  pool,
  useHarness,
  variantId,
  variant2Id,
} from "./harness";
import * as s from "../src/lib/db/schema";
import { extractVariantWeightGrams, calculateCartWeightGrams, calculateAuthoritativeShipping } from "../src/lib/shipping/calculator";
import { getShippingProvider, registerShippingProvider } from "../src/lib/shipping/provider";
import { MockShippingProvider } from "../src/lib/shipping/mock";
import { ShiprocketShippingProvider } from "../src/lib/shipping/shiprocket";
import { handleShippingWebhook } from "../src/lib/shipping/webhook";

useHarness();

const ADMIN = "admin_shipping_user";
const CUST_A = "customer_a";
const CUST_B = "customer_b";

async function promoteAdmin(user: string) {
  await db.update(s.profiles).set({ role: "admin" }).where(eq(s.profiles.clerkUserId, user));
}

describe("Shipping Provider Abstraction & Calculation", () => {
  it("extracts variant weight correctly from weightGrams or parses label", () => {
    expect(extractVariantWeightGrams({ weightGrams: 750, label: "500 g" })).toBe(750);
    expect(extractVariantWeightGrams({ weightGrams: null, label: "250 g" })).toBe(250);
    expect(extractVariantWeightGrams({ weightGrams: null, label: "1 kg" })).toBe(1000);
    expect(extractVariantWeightGrams({ weightGrams: null, label: "1.5 kg" })).toBe(1500);
    expect(extractVariantWeightGrams({ weightGrams: null, label: "Standard Pack" })).toBe(500);
  });

  it("calculates cart total weight accurately from database variants", async () => {
    const weight = await calculateCartWeightGrams(db, [
      { variantId, quantity: 2 }, // 250g * 2 = 500g
      { variantId: variant2Id, quantity: 1 }, // 500g * 1 = 500g
    ]);
    expect(weight).toBe(1000); // 1 kg
  });

  it("handles serviceability check correctly", async () => {
    const mock = new MockShippingProvider();
    registerShippingProvider(mock);

    const serviceable = await mock.checkServiceability("600001", 500);
    expect(serviceable.serviceable).toBe(true);
    expect(serviceable.courierName).toBeDefined();

    const unserviceable = await mock.checkServiceability("999999", 500);
    expect(unserviceable.serviceable).toBe(false);
    expect(unserviceable.message).toContain("Delivery is currently unavailable for this pincode.");
  });

  it("calculates authoritative shipping rate with free-shipping threshold", async () => {
    await db
      .insert(s.siteSettings)
      .values({
        key: "shipping",
        value: { flatRatePaise: 5000, freeShippingAbovePaise: 100000 },
      })
      .onConflictDoUpdate({
        target: s.siteSettings.key,
        set: { value: { flatRatePaise: 5000, freeShippingAbovePaise: 100000 } },
      });

    // Subtotal 50000 (< 100000): charged 5000 paise (Rs 50)
    const quote1 = await calculateAuthoritativeShipping(db, "600001", 500, 50000, "mock");
    expect(quote1.serviceable).toBe(true);
    expect(quote1.ratePaise).toBe(5000);
    expect(quote1.freeShipping).toBe(false);

    // Subtotal 120000 (>= 100000): free shipping (0 paise)
    const quote2 = await calculateAuthoritativeShipping(db, "600001", 500, 120000, "mock");
    expect(quote2.serviceable).toBe(true);
    expect(quote2.ratePaise).toBe(0);
    expect(quote2.freeShipping).toBe(true);
  });
});

describe("Customer Shipping Quote & Checkout Integration", () => {
  it("returns server-authoritative shipping quote for authenticated customer's address", async () => {
    const addr = await addAddress(CUST_A);
    await fillCart(CUST_A, [{ variantId, quantity: 2 }]);

    const res = await call("POST", "/api/shipping/quote", {
      user: CUST_A,
      body: { addressId: addr.id },
    });
    expect(res.status).toBe(200);
    expect(res.body.serviceable).toBe(true);
    expect(typeof res.body.ratePaise).toBe("number");
  });

  it("rejects shipping quote request for an address belonging to another customer", async () => {
    const addrA = await addAddress(CUST_A);
    await fillCart(CUST_B, [{ variantId, quantity: 1 }]);

    const res = await call("POST", "/api/shipping/quote", {
      user: CUST_B,
      body: { addressId: addrA.id }, // B tries to use A's address
    });
    expect(res.status).toBe(404);
  });

  it("rejects checkout with 422 if destination pincode is unserviceable", async () => {
    const unserviceableAddr = await addAddress(CUST_A, { pincode: "999999" });
    const res = await checkout(CUST_A, unserviceableAddr.id);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("UNSERVICEABLE_PINCODE");
    expect(res.body.error.message).toContain("Delivery is currently unavailable for this pincode.");
  });

  it("ensures authoritative order total includes shippingPaise and check constraint holds", async () => {
    await db
      .insert(s.siteSettings)
      .values({
        key: "shipping",
        value: { flatRatePaise: 4900, freeShippingAbovePaise: null },
      })
      .onConflictDoUpdate({
        target: s.siteSettings.key,
        set: { value: { flatRatePaise: 4900, freeShippingAbovePaise: null } },
      });

    const addr = await addAddress(CUST_A);
    // 2 * variantId @ 15000 = 30000 paise subtotal. Shipping = 4900 paise. Total = 34900 paise.
    const res = await checkout(CUST_A, addr.id);
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(34900);

    const [orderRow] = await db.select().from(s.orders).where(eq(s.orders.id, res.body.orderId));
    expect(orderRow.subtotalPaise).toBe(30000);
    expect(orderRow.shippingPaise).toBe(4900);
    expect(orderRow.totalPaise).toBe(34900);
    expect(orderRow.totalPaise).toBe(orderRow.subtotalPaise - orderRow.discountPaise + orderRow.shippingPaise);
  });
});

describe("Admin Shipment Management & Idempotency", () => {
  it("rejects unauthorized non-admin attempts to create shipments", async () => {
    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);

    const res = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/create`, {
      user: CUST_A, // not admin
      body: { providerId: "mock" },
    });
    expect(res.status).toBe(403);
  });

  it("rejects shipment creation for an unpaid order", async () => {
    await call("GET", "/api/me", { user: ADMIN });
    await promoteAdmin(ADMIN);

    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);

    const res = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/create`, {
      user: ADMIN,
      body: { providerId: "mock" },
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ORDER_UNPAID");
  });

  it("successfully creates shipment for a confirmed order and is idempotent", async () => {
    await call("GET", "/api/me", { user: ADMIN });
    await promoteAdmin(ADMIN);

    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);

    // Confirm the order (simulating payment)
    await db.update(s.orders).set({ status: "confirmed" }).where(eq(s.orders.id, co.body.orderId));

    // 1. Create shipment
    const createRes = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/create`, {
      user: ADMIN,
      body: { providerId: "mock", courierName: "Delhivery Surface" },
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.shipment).toBeDefined();
    expect(createRes.body.shipment.awb).toContain("MOCK-AWB");

    // Order should now be marked as shipped
    const [orderAfter] = await db.select().from(s.orders).where(eq(s.orders.id, co.body.orderId));
    expect(orderAfter.status).toBe("shipped");

    // 2. Retry creation (idempotency guard)
    const retryRes = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/create`, {
      user: ADMIN,
      body: { providerId: "mock", courierName: "Delhivery Surface" },
    });
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.alreadyExists).toBe(true);
    expect(retryRes.body.shipment.id).toBe(createRes.body.shipment.id);

    // Verify only ONE shipment record exists
    const allShipments = await db.select().from(s.shipments).where(eq(s.shipments.orderId, co.body.orderId));
    expect(allShipments.length).toBe(1);

    // Verify initial tracking event was created
    const events = await db
      .select()
      .from(s.shipmentTrackingEvents)
      .where(eq(s.shipmentTrackingEvents.shipmentId, createRes.body.shipment.id));
    expect(events.length).toBeGreaterThanOrEqual(1);

    // Verify audit log was recorded
    const [audit] = await db
      .select()
      .from(s.adminAuditLog)
      .where(and(eq(s.adminAuditLog.entityId, co.body.orderId), eq(s.adminAuditLog.action, "order.shipment_created")));
    expect(audit).toBeDefined();
  });

  it("synchronizes tracking and updates order when delivered", async () => {
    await call("GET", "/api/me", { user: ADMIN });
    await promoteAdmin(ADMIN);

    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);
    await db.update(s.orders).set({ status: "confirmed" }).where(eq(s.orders.id, co.body.orderId));

    const createRes = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/create`, {
      user: ADMIN,
      body: { providerId: "mock" },
    });
    const shipmentId = createRes.body.shipment.id;

    // Simulate provider moving to delivered
    const mock = getShippingProvider("mock") as MockShippingProvider;
    mock.trackingStore.set(createRes.body.shipment.awb, {
      status: "delivered",
      courierName: "Delhivery Surface",
      awb: createRes.body.shipment.awb,
      trackingUrl: createRes.body.shipment.trackingUrl,
      deliveredAt: new Date(),
      events: [
        {
          status: "delivered",
          description: "Delivered to recipient",
          location: "Chennai Hub",
          occurredAt: new Date(),
        },
      ],
    });

    // Admin syncs tracking
    const syncRes = await acall("POST", `/api/admin/orders/${co.body.orderId}/shipment/sync`, {
      user: ADMIN,
    });
    expect(syncRes.status).toBe(200);
    expect(syncRes.body.status).toBe("delivered");

    // Order status should automatically synchronize to delivered!
    const [orderDelivered] = await db.select().from(s.orders).where(eq(s.orders.id, co.body.orderId));
    expect(orderDelivered.status).toBe("delivered");

    const [shipmentDelivered] = await db.select().from(s.shipments).where(eq(s.shipments.id, shipmentId));
    expect(shipmentDelivered.status).toBe("delivered");
    expect(shipmentDelivered.deliveredAt).toBeDefined();
  });

  it("supports safe manual fallback for courier and AWB updates", async () => {
    await call("GET", "/api/me", { user: ADMIN });
    await promoteAdmin(ADMIN);

    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);
    await db.update(s.orders).set({ status: "shipped" }).where(eq(s.orders.id, co.body.orderId));
    await db.insert(s.shipments).values({
      orderId: co.body.orderId,
      provider: "manual",
      courierName: "India Post",
      awb: "IP123456789IN",
      status: "in_transit",
    });

    // Admin updates manual AWB
    const patchRes = await acall("PATCH", `/api/admin/orders/${co.body.orderId}/shipment`, {
      user: ADMIN,
      body: {
        courierName: "Blue Dart Express",
        awb: "BD987654321",
        trackingUrl: "https://track.bluedart.com/BD987654321",
      },
    });
    expect(patchRes.status).toBe(200);

    const [updated] = await db.select().from(s.shipments).where(eq(s.shipments.orderId, co.body.orderId));
    expect(updated.courierName).toBe("Blue Dart Express");
    expect(updated.awb).toBe("BD987654321");
    expect(updated.trackingUrl).toBe("https://track.bluedart.com/BD987654321");
  });
});

describe("Customer Tracking Timeline & Visibility", () => {
  it("allows customer to view their own shipment and tracking events", async () => {
    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);

    const [shp] = await db
      .insert(s.shipments)
      .values({
        orderId: co.body.orderId,
        provider: "delhivery",
        courierName: "Delhivery Surface",
        awb: "DELHI987654321",
        trackingUrl: "https://track.delhivery.com/DELHI987654321",
        status: "in_transit",
        shippedAt: new Date(),
      })
      .returning();

    await db.insert(s.shipmentTrackingEvents).values({
      shipmentId: shp.id,
      status: "in_transit",
      description: "Package departed from origin center",
      location: "Chennai Hub",
      occurredAt: new Date(),
    });

    const getRes = await call("GET", `/api/me/orders/${co.body.orderId}`, { user: CUST_A });
    expect(getRes.status).toBe(200);
    expect(getRes.body.shipments).toBeDefined();
    expect(getRes.body.shipments.length).toBe(1);
    expect(getRes.body.shipments[0].awb).toBe("DELHI987654321");
    expect(getRes.body.shipments[0].courierName).toBe("Delhivery Surface");
    expect(getRes.body.shipments[0].events.length).toBe(1);
    expect(getRes.body.shipments[0].events[0].description).toBe("Package departed from origin center");
  });

  it("prevents another customer from viewing or accessing foreign shipment details", async () => {
    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);

    const res = await call("GET", `/api/me/orders/${co.body.orderId}`, { user: CUST_B });
    expect(res.status).toBe(404);
  });
});

describe("Shipping Webhook Handling", () => {
  const secret = "mock_shipping_secret";

  it("rejects unsigned or invalid signature webhooks with 400", async () => {
    const req = new Request("https://spn.test/api/webhooks/shipping", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mock-shipping-signature": "forged_signature",
      },
      body: JSON.stringify({ awb: "MOCK123" }),
    });

    const res = await handleShippingWebhook(req, {
      providerId: "mock",
      withDb: async (fn) => fn(db),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_signature");
  });

  it("processes signed webhook, records tracking event, and is idempotent against duplicates", async () => {
    const addr = await addAddress(CUST_A);
    const co = await checkout(CUST_A, addr.id);
    await db.update(s.orders).set({ status: "shipped" }).where(eq(s.orders.id, co.body.orderId));

    const awb = "MOCK-WEBHOOK-AWB-101";
    const [shp] = await db
      .insert(s.shipments)
      .values({
        orderId: co.body.orderId,
        provider: "mock",
        courierName: "Delhivery Surface",
        awb,
        status: "in_transit",
      })
      .returning();

    const payload = {
      event_id: "evt_delivered_101",
      awb,
      status: "delivered",
      description: "Delivered to front porch",
      location: "Anna Nagar, Chennai",
      occurred_at: new Date().toISOString(),
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

    const req1 = new Request("https://spn.test/api/webhooks/shipping", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mock-shipping-signature": signature,
      },
      body: rawBody,
    });

    // First delivery: processed
    const res1 = await handleShippingWebhook(req1, {
      providerId: "mock",
      withDb: async (fn) => fn(db),
    });
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.status).toBe("processed");
    expect(body1.outcome).toBe("delivered");

    // Order should transition to delivered
    const [orderAfter] = await db.select().from(s.orders).where(eq(s.orders.id, co.body.orderId));
    expect(orderAfter.status).toBe("delivered");

    // Second delivery (duplicate event delivery): acknowledged as duplicate without duplicate events
    const req2 = new Request("https://spn.test/api/webhooks/shipping", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mock-shipping-signature": signature,
      },
      body: rawBody,
    });
    const res2 = await handleShippingWebhook(req2, {
      providerId: "mock",
      withDb: async (fn) => fn(db),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.status).toBe("duplicate");

    // Check tracking events count is exactly 1 (not duplicated)
    const events = await db
      .select()
      .from(s.shipmentTrackingEvents)
      .where(eq(s.shipmentTrackingEvents.shipmentId, shp.id));
    expect(events.length).toBe(1);
    expect(events[0].status).toBe("delivered");
  });
});
