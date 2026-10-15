"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type DashboardData = {
  ordersByStatus: Record<string, number>;
  toFulfil: number;
  openRefunds: number;
  last30Days: {
    paidOrders: number;
    revenuePaise: number;
  };
  lowStockVariants: number;
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

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to load dashboard operational metrics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="h-8 w-48 bg-stone-200 animate-pulse rounded" />
          <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-rose-200 bg-rose-50 text-rose-800">
        <h2 className="text-base font-semibold mb-1">Failed to Load Dashboard Data</h2>
        <p className="text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-4 py-2 text-xs font-semibold rounded bg-rose-700 text-white hover:bg-rose-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)]">
            Operations Dashboard
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time fulfillment, inventory levels, and order pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-warm)] transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders to Fulfil */}
        <Link
          href="/admin/orders"
          className="p-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-brand-primary)]/40 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>To Fulfil</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text-primary)]">
            {data.toFulfil}
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Confirmed, processing, or packed
          </p>
        </Link>

        {/* Low Stock Variants */}
        <Link
          href="/admin/products"
          className="p-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:border-amber-400 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>Low Stock Items</span>
            <span className={`w-2 h-2 rounded-full ${data.lowStockVariants > 0 ? "bg-amber-500" : "bg-stone-300"}`} />
          </div>
          <div className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-amber-800">
            {data.lowStockVariants}
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Active variants with stock ≤ 5
          </p>
        </Link>

        {/* Attention / Open Refunds */}
        <Link
          href="/admin/orders?attention=true"
          className="p-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:border-rose-400 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>Needs Attention</span>
            <span className={`w-2 h-2 rounded-full ${data.openRefunds > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
          </div>
          <div className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-rose-800">
            {data.openRefunds}
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Pending refund or fulfillment flags
          </p>
        </Link>

        {/* Last 30 Days Paid Revenue */}
        <div className="p-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>Last 30 Days (Paid)</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {data.last30Days.paidOrders} orders
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-emerald-800">
            {formatPrice(data.last30Days.revenuePaise)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Fulfilled and active captured orders
          </p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--color-text-primary)]">
              Orders Status Breakdown
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Full distribution of orders in the database
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)]"
          >
            View all orders &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
            const count = data.ordersByStatus[statusKey] ?? 0;
            return (
              <Link
                key={statusKey}
                href={`/admin/orders?status=${statusKey}`}
                className="p-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 hover:bg-[var(--color-surface-warm)] transition-colors flex items-center justify-between"
              >
                <div>
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <span className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-text-primary)]">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Operational Quick Actions */}
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--color-text-primary)] mb-3">
          Catalogue &amp; Fulfilment Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-3 p-3.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)] hover:border-[var(--color-brand-primary)]/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-md bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                Add New Product
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                Create title, slug, and packaging version
              </span>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center gap-3 p-3.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)] hover:border-[var(--color-brand-primary)]/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-md bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                Manage Categories
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                Organise and order store taxonomy
              </span>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 p-3.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)] hover:border-[var(--color-brand-primary)]/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-md bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                Process Orders
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                Update status, dispatch, and add tracking
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
