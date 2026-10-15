"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  attentionReason: string | null;
  needsAttention: boolean;
  itemCount: number;
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
  shipTo: string | null;
  shipCity: string | null;
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

export function OrdersList() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const initialAttention = searchParams.get("attention") === "true";

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [attentionFilter, setAttentionFilter] = useState(initialAttention);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (attentionFilter) params.set("attention", "true");
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to load orders.");
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, attentionFilter, searchQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)]">
            Orders Management
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Track customer orders, fulfilment progress, payments, and dispatch status
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-warm)] transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)]"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-text-muted)] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setAttentionFilter(!attentionFilter);
                setPage(1);
              }}
              className={`px-3 py-2 text-xs rounded border transition-colors flex items-center gap-1.5 ${
                attentionFilter
                  ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold"
                  : "bg-[var(--color-surface-warm)]/40 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${attentionFilter ? "bg-rose-600" : "bg-stone-400"}`} />
              <span>Needs Attention</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded bg-[var(--color-surface-warm)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              Filter
            </button>

            {(statusFilter || attentionFilter || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setAttentionFilter(false);
                  setSearchQuery("");
                  setPage(1);
                }}
                className="px-3 py-2 text-xs text-stone-600 hover:text-stone-900 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-6 space-y-3">
          <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-stone-100 animate-pulse rounded" />
          ))}
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="p-6 rounded-lg border border-rose-200 bg-rose-50 text-rose-800">
          <h2 className="text-sm font-semibold mb-1">Failed to load orders</h2>
          <p className="text-xs mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-700 text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            No orders match the specified filters.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Clear your search query or status filter to see all orders.
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && orders.length > 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-warm)]/60 border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-medium">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Ship To</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {orders.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] || { label: o.status, color: "bg-stone-50 text-stone-700" };

                  return (
                    <tr key={o.id} className="hover:bg-[var(--color-surface-warm)]/30 transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-bold text-[var(--color-text-primary)]">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-[var(--color-brand-primary)]">
                          {o.orderNumber}
                        </Link>
                        {o.needsAttention && (
                          <span
                            className="block text-[10px] text-rose-700 font-semibold mt-0.5 truncate max-w-xs"
                            title={o.attentionReason || "Needs attention"}
                          >
                            ⚠️ {o.attentionReason || "Attention required"}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--color-text-primary)] truncate max-w-xs">
                          {o.customer.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] truncate max-w-xs">
                          {o.customer.email}
                        </div>
                      </td>

                      {/* Ship To City */}
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        <span className="block truncate max-w-[120px]">
                          {o.shipTo || "—"}
                        </span>
                        {o.shipCity && (
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {o.shipCity}
                          </span>
                        )}
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-4 text-center font-medium">
                        {o.itemCount}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)]">
                        {formatPrice(o.totalPaise)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-warm)] transition-colors inline-block"
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-medium text-[var(--color-text-primary)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
