"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, AlertCircle, Truck, Package, CheckCircle2, ExternalLink, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "./orders-list";
import type { AddressSnapshot } from "@/lib/db/schema";

interface TrackingEventData {
  id: string;
  status: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
}

interface ShipmentData {
  id?: string;
  courierName: string | null;
  awb: string | null;
  trackingUrl: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  events?: TrackingEventData[];
}

interface OrderDetailData {
  id: string;
  orderNumber: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  shippingAddress: AddressSnapshot;
  customerNote: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    variantLabel: string;
    sku: string;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
  }[];
  shipments?: ShipmentData[];
}


export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/me/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404 || res.status === 401 || res.status === 403) {
            if (isMounted) setError("Order not found.");
            return;
          }
          throw new Error("Failed to load order");
        }
        const data = await res.json();
        if (isMounted) setOrder(data);
      } catch (err) {
        console.error("Order detail error:", err);
        if (isMounted) setError("We couldn't load this order. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)] font-[family-name:var(--font-body)]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
        <p className="mt-3 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 sm:p-12 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-center font-[family-name:var(--font-body)] max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-[var(--color-text-primary)] mb-2">
          Order Not Found
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed">
          The requested order could not be found or is not associated with your account.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const addr = order.shippingAddress;

  return (
    <div className="space-y-8 font-[family-name:var(--font-body)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/account/orders"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Orders</span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)] font-bold">
              Order #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Placed on {dateStr}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-[var(--color-text-muted)] block">Total Paid</span>
          <span className="font-[family-name:var(--font-price)] text-xl font-bold text-[var(--color-brand-primary)]">
            {formatPrice(order.totalPaise)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tracking & Historical Items (lg:col-span-7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Shipment & Courier Tracking Section */}
          <section
            aria-labelledby="tracking-heading"
            className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-xs)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3 mb-4">
              <h2
                id="tracking-heading"
                className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] flex items-center gap-2"
              >
                <Truck className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
                <span>Delivery &amp; Tracking</span>
              </h2>
              {order.shipments && order.shipments.length > 0 && order.shipments[0].awb && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
                  AWB: {order.shipments[0].awb}
                </span>
              )}
            </div>

            {/* Courier Meta */}
            {order.shipments && order.shipments.length > 0 && order.shipments[0].awb ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[11px]">Courier Partner</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {order.shipments[0].courierName || "Standard Courier"}
                    </span>
                  </div>
                  {order.shipments[0].trackingUrl && (
                    <a
                      href={order.shipments[0].trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      <span>Track on Courier Site</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>

                {/* Tracking Events Timeline */}
                {order.shipments[0].events && order.shipments[0].events.length > 0 ? (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">
                      Shipment Activity
                    </h3>
                    <div className="space-y-3 relative pl-4 border-l-2 border-[var(--color-border)] text-xs">
                      {order.shipments[0].events.map((ev, idx) => (
                        <div key={ev.id || idx} className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)] ring-4 ring-[var(--color-surface-raised)]" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-[var(--color-text-primary)]">
                              {ev.description || ev.status.replace("_", " ").toUpperCase()}
                            </p>
                            {ev.location && (
                              <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{ev.location}</span>
                              </p>
                            )}
                            <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(ev.occurredAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Dispatched. Courier tracking updates will appear here as the package moves.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-1">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {order.status === "delivered"
                    ? "Order has been delivered."
                    : order.status === "shipped"
                    ? "Order dispatched. Courier details will be updated shortly."
                    : order.status === "packed"
                    ? "Your order has been packed and is awaiting courier pickup."
                    : "Your order is being processed for packing and dispatch."}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  We will notify you and provide a tracking link as soon as your shipment is dispatched.
                </p>
              </div>
            )}
          </section>

          <section
            aria-labelledby="items-heading"
            className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-xs)]"
          >
            <h2
              id="items-heading"
              className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3"
            >
              Items in this Order
            </h2>


            <div className="divide-y divide-[var(--color-border)]">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-[family-name:var(--font-product)] text-sm font-medium text-[var(--color-text-primary)]">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.variantLabel} &times; {item.quantity}
                    </p>
                    <p className="text-xs font-mono text-[var(--color-text-muted)]">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-[family-name:var(--font-price)] text-sm font-semibold text-[var(--color-text-primary)]">
                      {formatPrice(item.lineTotalPaise)}
                    </span>
                    <span className="font-[family-name:var(--font-price)] text-xs text-[var(--color-text-muted)] block">
                      {formatPrice(item.unitPricePaise)} each
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Totals Breakdown */}
            <div className="border-t border-[var(--color-border)] pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--color-text-body)]">
                <span>Items Subtotal</span>
                <span className="font-[family-name:var(--font-price)]">{formatPrice(order.subtotalPaise)}</span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-[var(--color-success)]">
                  <span>Discount</span>
                  <span className="font-[family-name:var(--font-price)]">−{formatPrice(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--color-text-body)]">
                <span>Shipping</span>
                <span className="font-[family-name:var(--font-price)]">
                  {order.shippingPaise === 0 ? "Free" : formatPrice(order.shippingPaise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                <span>Total Amount</span>
                <span className="font-[family-name:var(--font-price)] text-base font-bold text-[var(--color-brand-primary)]">
                  {formatPrice(order.totalPaise)}
                </span>
              </div>
            </div>
          </section>

          {/* Customer Note if present */}
          {order.customerNote && (
            <section
              aria-labelledby="note-heading"
              className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-xs)]"
            >
              <h2
                id="note-heading"
                className="font-[family-name:var(--font-heading)] text-base text-[var(--color-text-primary)] mb-2"
              >
                Delivery Instructions
              </h2>
              <p className="text-xs text-[var(--color-text-body)] italic leading-relaxed">
                &ldquo;{order.customerNote}&rdquo;
              </p>
            </section>
          )}
        </div>

        {/* Right Column: Historical Address Snapshot (lg:col-span-5) */}
        <div className="space-y-6 lg:col-span-5">
          <section
            aria-labelledby="address-heading"
            className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-xs)]"
          >
            <h2
              id="address-heading"
              className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3 mb-4 flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden="true" />
              <span>Delivery Address</span>
            </h2>

            {addr ? (
              <div className="text-xs space-y-1.5 text-[var(--color-text-body)] leading-relaxed">
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {addr.fullName}
                </p>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                {addr.landmark && (
                  <p className="text-[var(--color-text-muted)]">
                    Landmark: {addr.landmark}
                  </p>
                )}
                <p>
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="pt-2 text-[var(--color-text-muted)]">
                  Phone: +91 {addr.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Address details unavailable.
              </p>
            )}
          </section>

          <section
            aria-labelledby="help-heading"
            className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)]/60 p-5 text-xs text-[var(--color-text-body)]"
          >
            <h3
              id="help-heading"
              className="font-semibold text-[var(--color-text-primary)] mb-1"
            >
              Need assistance with this order?
            </h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              For queries regarding your order, please mention your order reference <strong className="text-[var(--color-text-primary)]">#{order.orderNumber}</strong> when contacting our team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
