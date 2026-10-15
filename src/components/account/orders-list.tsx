"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ArrowRight, AlertCircle, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AddressSnapshot } from "@/lib/db/schema";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  shippingAddress: AddressSnapshot;
  customerNote: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success)]">
          Confirmed
        </span>
      );
    case "pending_payment":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-warning-bg)] text-[var(--color-warning)]">
          Pending Payment
        </span>
      );
    case "processing":
    case "packed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] border border-[var(--color-border)]">
          Processing
        </span>
      );
    case "shipped":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
          Shipped
        </span>
      );
    case "delivered":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success)]">
          Delivered
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-error-bg)] text-[var(--color-error)]">
          Cancelled
        </span>
      );
    case "refunded":
    case "refund_required":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          Refunded
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-sunken)] text-[var(--color-text-body)]">
          {status}
        </span>
      );
  }
}

export function OrdersList({ limit }: { limit?: number }) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = limit ? `/api/me/orders?limit=${limit}` : "/api/me/orders";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sign-in required to view orders.");
          return;
        }
        const errData = await res.json().catch(() => null);
        setError(errData?.message || "We couldn't load your orders. Please try again.");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setError("We couldn't load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] animate-pulse"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="h-4 w-32 bg-[var(--color-surface-sunken)] rounded" />
              <div className="h-4 w-20 bg-[var(--color-surface-sunken)] rounded" />
            </div>
            <div className="h-3 w-44 bg-[var(--color-surface-sunken)] rounded mb-4" />
            <div className="h-8 w-28 bg-[var(--color-surface-sunken)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-center">
        <AlertCircle className="h-8 w-8 text-[var(--color-error)] mx-auto mb-3" />
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] mb-4">
          {error}
        </p>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center justify-center px-4 py-2 rounded-[8px] bg-[var(--color-brand-primary)] text-white text-xs font-semibold hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] shadow-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 px-6 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center mx-auto mb-4 text-[var(--color-text-muted)]">
          <ShoppingBag className="h-6 w-6 text-[var(--color-brand-primary)]/70" />
        </div>
        <h3 className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] mb-1">
          No orders yet
        </h3>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-text-body)] mb-6 max-w-sm mx-auto leading-relaxed">
          Your orders will appear here after you place your first order.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.98] text-white font-[family-name:var(--font-body)] text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] shadow-xs"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-[family-name:var(--font-body)]">
      {orders.map((order) => {
        const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <div
            key={order.id}
            className="p-5 sm:p-6 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] transition-all shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                  #{order.orderNumber}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Placed on {dateStr}
              </p>
              <div className="text-xs text-[var(--color-text-body)] pt-1">
                Delivering to: <span className="font-medium text-[var(--color-text-primary)]">{order.shippingAddress?.fullName}</span> ({order.shippingAddress?.city})
              </div>
            </div>

            <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 border-[var(--color-border)] pt-3 sm:pt-0 gap-3">
              <div className="sm:text-right">
                <span className="text-xs text-[var(--color-text-muted)] block">Total</span>
                <span className="font-[family-name:var(--font-price)] font-semibold text-base text-[var(--color-brand-primary)]">
                  {formatPrice(order.totalPaise)}
                </span>
              </div>
              <Link
                href={`/account/orders/${order.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
              >
                <span>View Order</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
