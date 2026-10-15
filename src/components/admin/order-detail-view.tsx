"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  title: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  pricePaise: number;
  totalPaise: number;
};

type Payment = {
  id: string;
  razorpayPaymentId: string | null;
  status: string;
  amountPaise: number;
  method: string | null;
  createdAt: string;
};

type Shipment = {
  id: string;
  provider?: string;
  courierName: string | null;
  awb: string | null;
  trackingUrl: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  events?: Array<{
    id: string;
    status: string;
    description: string | null;
    location?: string | null;
    occurredAt: string;
  }>;
};


type AuditActivity = {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  actor: {
    id: string;
    email: string;
  } | null;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  notes: string | null;
  attentionReason: string | null;
  subtotalPaise: number;
  shippingAmountPaise: number;
  discountPaise: number;
  totalPaise: number;
  couponId?: string | null;
  couponCode?: string | null;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  activity: AuditActivity[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-700 border-amber-200" },
  packed: { label: "Packed", color: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped: { label: "Shipped", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_payment: { label: "Pending Payment", color: "bg-stone-50 text-stone-700 border-stone-200" },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200" },
  refunded: { label: "Refunded", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const FORWARD_SEQUENCE = ["confirmed", "processing", "packed", "shipped", "delivered"];
const CANCELLABLE_STATUSES = ["pending_payment", "confirmed", "processing", "packed"];

export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [courierName, setCourierName] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Internal Note Editor
  const [editingNote, setEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Shipment Tracking Form
  const [editingShipment, setEditingShipment] = useState(false);
  const [shipCourier, setShipCourier] = useState("");
  const [shipAwb, setShipAwb] = useState("");
  const [shipUrl, setShipUrl] = useState("");
  const [savingShipment, setSavingShipment] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [syncingTracking, setSyncingTracking] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const fetchOrder = async () => {

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to load order.");
      }
      const data: OrderDetail = await res.json();
      setOrder(data);
      setNoteContent(data.notes || "");
      if (data.shipments.length > 0) {
        setShipCourier(data.shipments[0].courierName || "");
        setShipAwb(data.shipments[0].awb || "");
        setShipUrl(data.shipments[0].trackingUrl || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Open Status Transition Modal
  const openStatusTransition = (nextStatus: string) => {
    setTargetStatus(nextStatus);
    setCancelReason("");
    setCourierName(order?.shipments[0]?.courierName || "India Post / Delhivery");
    setAwb(order?.shipments[0]?.awb || "");
    setTrackingUrl(order?.shipments[0]?.trackingUrl || "");
    setTransitionError(null);
    setStatusModalOpen(true);
  };

  // Execute Status Transition
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransitioning(true);
    setTransitionError(null);

    const payload: any = {
      status: targetStatus,
    };

    if (targetStatus === "cancelled") {
      if (!cancelReason.trim()) {
        setTransitionError("A cancellation reason is required.");
        setTransitioning(false);
        return;
      }
      payload.cancelReason = cancelReason.trim();
    }

    if (targetStatus === "shipped") {
      if (!courierName.trim() || !awb.trim()) {
        setTransitionError("Courier name and AWB tracking number are required to dispatch.");
        setTransitioning(false);
        return;
      }
      payload.shipment = {
        courierName: courierName.trim(),
        awb: awb.trim(),
        trackingUrl: trackingUrl.trim() || null,
      };
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error?.message || "Failed to update order status.");
      }

      setActionSuccess(`Order updated to ${targetStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setStatusModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setTransitionError(err.message || "Status update failed");
    } finally {
      setTransitioning(false);
    }
  };

  // Save Internal Admin Note
  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ note: noteContent.trim() || null }),
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok) throw new Error(resData?.error?.message || "Failed to save note.");

      setActionSuccess("Internal note updated.");
      setTimeout(() => setActionSuccess(null), 4000);
      setEditingNote(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  // Update Shipment Tracking Details
  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShipment(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          courierName: shipCourier.trim(),
          awb: shipAwb.trim(),
          trackingUrl: shipUrl.trim() || null,
        }),
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok) throw new Error(resData?.error?.message || "Failed to update shipment.");

      setActionSuccess("Shipment tracking updated.");
      setTimeout(() => setActionSuccess(null), 4000);
      setEditingShipment(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to update shipment");
    } finally {
      setSavingShipment(false);
    }
  };

  const handleCreateShipment = async (providerId: string = "shiprocket") => {
    setCreatingShipment(true);
    setShipmentError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message || "Failed to create shipment.");
      setActionSuccess("Shipment generated successfully.");
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchOrder();
    } catch (err: any) {
      setShipmentError(err.message || "Failed to create shipment");
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleSyncTracking = async () => {
    setSyncingTracking(true);
    setShipmentError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message || "Failed to refresh tracking.");
      setActionSuccess(`Tracking refreshed: ${data.newEventsCount ?? 0} new updates recorded.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchOrder();
    } catch (err: any) {
      setShipmentError(err.message || "Failed to refresh tracking");
    } finally {
      setSyncingTracking(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
        <div className="h-10 w-72 bg-stone-200 animate-pulse rounded" />
        <div className="h-96 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 rounded-lg border border-rose-200 bg-rose-50 text-rose-800">
        <h2 className="text-sm font-semibold mb-1">Failed to load order</h2>
        <p className="text-xs mb-3">{error || "Order not found."}</p>
        <Link
          href="/admin/orders"
          className="inline-block px-3 py-1.5 text-xs font-semibold rounded bg-rose-700 text-white hover:bg-rose-800"
        >
          Back to Orders List
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-stone-50 text-stone-700" };
  const currentForwardIndex = FORWARD_SEQUENCE.indexOf(order.status);
  const nextForwardStatus = currentForwardIndex >= 0 && currentForwardIndex < FORWARD_SEQUENCE.length - 1
    ? FORWARD_SEQUENCE[currentForwardIndex + 1]
    : null;
  const isCancellable = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Link href="/admin/orders" className="hover:text-[var(--color-brand-primary)]">
          Orders
        </Link>
        <span>&gt;</span>
        <span className="text-[var(--color-text-primary)] font-medium font-mono">{order.orderNumber}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)] font-mono">
              {order.orderNumber}
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {nextForwardStatus && (
            <button
              type="button"
              onClick={() => openStatusTransition(nextForwardStatus)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)] transition-colors shadow-2xs"
            >
              Move to {STATUS_CONFIG[nextForwardStatus]?.label || nextForwardStatus} &rarr;
            </button>
          )}

          {isCancellable && (
            <button
              type="button"
              onClick={() => openStatusTransition("cancelled")}
              className="px-3 py-1.5 text-xs font-medium rounded border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {/* Attention Flag Banner */}
      {order.attentionReason && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Action Required: {order.attentionReason}</span>
          </div>
          <p className="text-[11px] text-rose-700">
            This order is flagged for manual administrative review or refund resolution.
          </p>
        </div>
      )}

      {/* 2-Column Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Items & Payments) - 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)]">
                Ordered Items ({order.items.length})
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                Historical snapshot prices
              </span>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)] block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      Variant: {item.variantLabel} &bull; SKU: {item.sku}
                    </span>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      {formatPrice(item.pricePaise)} &times; {item.quantity} unit{item.quantity === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="font-bold text-sm text-[var(--color-text-primary)] font-mono">
                    {formatPrice(item.totalPaise)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/20 space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(order.subtotalPaise)}</span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <span>Discount</span>
                    {order.couponCode && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="font-mono">-{formatPrice(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Shipping</span>
                <span className="font-mono">
                  {order.shippingAmountPaise === 0 ? "FREE" : formatPrice(order.shippingAmountPaise)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border-subtle)]">
                <span>Total Amount</span>
                <span className="font-mono text-[var(--color-brand-primary)]">
                  {formatPrice(order.totalPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5">
            <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)] mb-3">
              Payment Gateway Records
            </h2>
            {order.payments.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No payment records found.</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/30 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-[var(--color-text-primary)]">
                          {p.razorpayPaymentId || "Payment ID Pending"}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                            p.status === "captured"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "refunded"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : "bg-stone-100 text-stone-700 border border-stone-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Method: {p.method || "Razorpay Online"} &bull; {new Date(p.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-[var(--color-text-primary)]">
                      {formatPrice(p.amountPaise)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipment & Tracking Details */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)]">
                Shipment &amp; Courier Tracking
              </h2>
              <div className="flex items-center gap-2">
                {order.shipments.length > 0 ? (
                  <>
                    <button
                      type="button"
                      disabled={syncingTracking}
                      onClick={handleSyncTracking}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 transition-colors disabled:opacity-50"
                    >
                      {syncingTracking ? "Syncing..." : "Refresh Tracking"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingShipment(!editingShipment)}
                      className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      {editingShipment ? "Cancel" : "Edit Tracking"}
                    </button>
                  </>
                ) : (
                  <>
                    {order.status !== "cancelled" && order.status !== "refunded" && (
                      <button
                        type="button"
                        disabled={creatingShipment}
                        onClick={() => handleCreateShipment("shiprocket")}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white transition-colors disabled:opacity-50"
                      >
                        {creatingShipment ? "Creating..." : "Create Shipment"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingShipment(!editingShipment)}
                      className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      {editingShipment ? "Cancel" : "Manual Dispatch"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {shipmentError && (
              <div className="mb-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {shipmentError}
              </div>
            )}

            {editingShipment ? (
              <form onSubmit={handleSaveShipment} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[var(--color-text-primary)] mb-1">
                      Courier Partner *
                    </label>
                    <input
                      type="text"
                      required
                      value={shipCourier}
                      onChange={(e) => setShipCourier(e.target.value)}
                      placeholder="e.g. India Post, Delhivery, BlueDart"
                      className="w-full px-3 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--color-text-primary)] mb-1">
                      AWB / Tracking Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={shipAwb}
                      onChange={(e) => setShipAwb(e.target.value)}
                      placeholder="e.g. IN123456789"
                      className="w-full px-3 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--color-text-primary)] mb-1">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={shipUrl}
                    onChange={(e) => setShipUrl(e.target.value)}
                    placeholder="https://track.courier.in/..."
                    className="w-full px-3 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(false)}
                    className="px-3 py-1.5 rounded border border-[var(--color-border-subtle)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingShipment}
                    className="px-4 py-1.5 rounded bg-[var(--color-brand-primary)] text-white font-semibold disabled:opacity-50"
                  >
                    {savingShipment ? "Saving..." : "Save Shipment"}
                  </button>
                </div>
              </form>
            ) : order.shipments.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                No tracking information recorded yet. Click &quot;Create Shipment&quot; or &quot;Manual Dispatch&quot; to assign courier details.
              </p>
            ) : (
              <div className="space-y-4 text-xs">
                {order.shipments.map((s) => (
                  <div key={s.id} className="p-3.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {s.courierName || "Standard Shipping"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-100 text-stone-700 border border-stone-200">
                          {s.provider}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {s.status}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--color-brand-primary)]">
                        AWB: {s.awb}
                      </span>
                    </div>

                    {s.trackingUrl && (
                      <a
                        href={s.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[var(--color-brand-primary)] hover:underline inline-block font-medium"
                      >
                        Track package on courier portal &rarr;
                      </a>
                    )}

                    <div className="flex flex-wrap gap-4 text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border-subtle)]">
                      {s.shippedAt && (
                        <span>Dispatched: {new Date(s.shippedAt).toLocaleString()}</span>
                      )}
                      {s.deliveredAt && (
                        <span>Delivered: {new Date(s.deliveredAt).toLocaleString()}</span>
                      )}
                    </div>

                    {/* Tracking Events timeline if available */}
                    {s.events && s.events.length > 0 && (
                      <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                        <h4 className="font-semibold text-[11px] text-[var(--color-text-primary)] mb-2">
                          Activity Log ({s.events.length})
                        </h4>
                        <div className="space-y-2 pl-3 border-l-2 border-stone-200 text-[11px]">
                          {s.events.map((ev: any, idx: number) => (
                            <div key={ev.id || idx} className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-[var(--color-text-primary)]">
                                  {ev.description || ev.status}
                                </span>
                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                  {new Date(ev.occurredAt).toLocaleTimeString()}
                                </span>
                              </div>
                              {ev.location && (
                                <span className="text-[10px] text-[var(--color-text-muted)] block">
                                  {ev.location}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Customer, Address, Notes & Audit) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5 text-xs">
            <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)] mb-3">
              Customer Information
            </h2>
            <div className="space-y-2">
              <div>
                <span className="block text-[11px] text-[var(--color-text-muted)]">Name</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {order.customer.name || "Customer"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--color-text-muted)]">Email</span>
                <a href={`mailto:${order.customer.email}`} className="text-[var(--color-brand-primary)] hover:underline truncate block">
                  {order.customer.email}
                </a>
              </div>
              {order.customer.phone && (
                <div>
                  <span className="block text-[11px] text-[var(--color-text-muted)]">Profile Phone</span>
                  <span className="font-mono text-[var(--color-text-primary)]">
                    {order.customer.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5 text-xs">
            <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)] mb-3">
              Delivery Address Snapshot
            </h2>
            <div className="space-y-1 text-[var(--color-text-secondary)]">
              <span className="font-bold text-[var(--color-text-primary)] block">
                {order.shippingAddress.fullName}
              </span>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <div className="pt-2 text-[var(--color-text-primary)] font-mono font-medium">
                Phone: {order.shippingAddress.phone}
              </div>
            </div>
          </div>

          {/* Internal Admin Note */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)]">
                Internal Staff Note
              </h2>
              <button
                type="button"
                onClick={() => setEditingNote(!editingNote)}
                className="text-[11px] font-semibold text-[var(--color-brand-primary)] hover:underline"
              >
                {editingNote ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Private notes (not visible to customer)..."
                  className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-3 py-1.5 rounded bg-[var(--color-brand-primary)] text-white font-semibold disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)] italic">
                {order.notes || "No internal notes for this order."}
              </p>
            )}
          </div>

          {/* Audit Activity Trail */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5 text-xs">
            <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text-primary)] mb-3">
              Order Audit Activity
            </h2>
            {order.activity.length === 0 ? (
              <p className="text-[11px] text-[var(--color-text-muted)]">No recorded admin mutations yet.</p>
            ) : (
              <div className="space-y-3">
                {order.activity.map((act) => (
                  <div key={act.id} className="pb-2 border-b border-[var(--color-border-subtle)] last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {act.actor?.email && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        by {act.actor.email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Transition Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg max-w-md w-full p-6 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-4">
              <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--color-text-primary)]">
                {targetStatus === "cancelled" ? "Cancel Order" : `Update Status to "${STATUS_CONFIG[targetStatus]?.label || targetStatus}"`}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {transitionError && (
              <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {transitionError}
              </div>
            )}

            <form onSubmit={handleTransitionSubmit} className="space-y-4">
              {targetStatus === "cancelled" ? (
                <div>
                  <p className="text-rose-700 font-medium mb-3">
                    Cancelling this order will release held variant inventory back to available stock.
                  </p>
                  <label htmlFor="cancel-reason" className="block font-medium text-[var(--color-text-primary)] mb-1">
                    Cancellation Reason (Required) *
                  </label>
                  <textarea
                    id="cancel-reason"
                    rows={3}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Customer requested cancellation before dispatch..."
                    className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              ) : targetStatus === "shipped" ? (
                <div className="space-y-3">
                  <p className="text-[var(--color-text-secondary)]">
                    Provide dispatch courier details to complete shipping transition.
                  </p>
                  <div>
                    <label htmlFor="ship-courier" className="block font-medium text-[var(--color-text-primary)] mb-1">
                      Courier Partner *
                    </label>
                    <input
                      id="ship-courier"
                      type="text"
                      required
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Delhivery, India Post"
                      className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="ship-awb" className="block font-medium text-[var(--color-text-primary)] mb-1">
                      AWB / Tracking Number *
                    </label>
                    <input
                      id="ship-awb"
                      type="text"
                      required
                      value={awb}
                      onChange={(e) => setAwb(e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="ship-track-url" className="block font-medium text-[var(--color-text-primary)] mb-1">
                      Tracking Link (Optional)
                    </label>
                    <input
                      id="ship-track-url"
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://track.courier.in/..."
                      className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] font-mono text-xs"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[var(--color-text-secondary)]">
                  Confirm transition of this order from{" "}
                  <strong>{statusCfg.label}</strong> to{" "}
                  <strong>{STATUS_CONFIG[targetStatus]?.label || targetStatus}</strong>.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={transitioning}
                  className="px-3 py-1.5 rounded border border-[var(--color-border-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className={`px-4 py-1.5 rounded font-semibold text-white transition-colors disabled:opacity-50 ${
                    targetStatus === "cancelled" ? "bg-rose-600 hover:bg-rose-700" : "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)]"
                  }`}
                >
                  {transitioning ? "Updating..." : targetStatus === "cancelled" ? "Confirm Cancellation" : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
