"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variantCount: number;
  minPricePaise: number | null;
  maxPricePaise: number | null;
  totalStock: number;
  imageKey: string | null;
  imageUrl: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

export function ProductsList() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load categories for filter dropdown
  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch((err) => console.error("Could not fetch categories:", err));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (activeFilter !== "") params.set("active", activeFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));

      const res = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to load products.");
      }
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, activeFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Origin: window.location.origin,
        },
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error?.message || "Could not delete product.");
      }

      setActionSuccess(`Product "${deleteTarget.name}" deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Could not delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductActive = async (p: ProductListItem) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to update status.");
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)]">
            Products Catalogue
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage product descriptions, pricing, stock, and variants
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)] transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Product</span>
        </Link>
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

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, slug, or variant SKU..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded bg-[var(--color-surface-warm)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              Filter
            </button>

            {(searchQuery || categoryFilter || activeFilter !== "") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                  setActiveFilter("");
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
          <h2 className="text-sm font-semibold mb-1">Failed to load products</h2>
          <p className="text-xs mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchProducts}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-700 text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {searchQuery || categoryFilter || activeFilter !== ""
              ? "No products match the selected filters."
              : "No products found in the catalogue."}
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)]"
          >
            Create Product
          </Link>
        </div>
      )}

      {/* Product List Table */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-warm)]/60 border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-medium">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Variants</th>
                  <th className="py-3 px-4">Price Range</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {products.map((p) => {
                  const hasPrice = p.minPricePaise !== null;
                  const priceLabel = hasPrice
                    ? p.minPricePaise === p.maxPricePaise
                      ? formatPrice(p.minPricePaise!)
                      : `${formatPrice(p.minPricePaise!)} - ${formatPrice(p.maxPricePaise!)}`
                    : "No active price";

                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-surface-warm)]/30 transition-colors">
                      {/* Product Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)] shrink-0 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]"
                            >
                              {p.name}
                            </Link>
                            <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                              /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {p.category.name}
                      </td>

                      {/* Variants Count */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            p.variantCount === 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"
                          }`}
                        >
                          {p.variantCount}
                        </span>
                      </td>

                      {/* Price Range */}
                      <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">
                        {priceLabel}
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            p.totalStock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : p.totalStock <= 5
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {p.totalStock}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductActive(p)}
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                          }`}
                          title="Click to toggle status"
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="px-2.5 py-1 rounded text-xs font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-warm)] transition-colors inline-block"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} products
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg max-w-sm w-full p-6 shadow-lg">
            <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-rose-800 mb-2">
              Delete Product
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Are you sure you want to delete <span className="font-semibold text-[var(--color-text-primary)]">"{deleteTarget.name}"</span>?
              <span className="block mt-2 font-medium text-stone-600">
                Note: If this product has ever been ordered by a customer, the database will refuse deletion to protect order audit history. In that case, deactivate the product instead.
              </span>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
