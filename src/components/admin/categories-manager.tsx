"use client";

import { useEffect, useState } from "react";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  imageKey: string | null;
  imageUrl: string | null;
  productCount: number;
  createdAt: string;
};

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal / Form state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form values
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to load categories.");
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(categories.length);
    setIsActive(true);
    setFormError(null);
    setIsCreating(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setFormError(null);
    setIsCreating(true);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload: any = {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      sortOrder: Number(sortOrder),
      isActive,
    };
    if (slug.trim()) {
      payload.slug = slug.trim();
    }

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error?.message || "Operation failed.");
      }

      setActionSuccess(editingCategory ? "Category updated successfully." : "Category created successfully.");
      setTimeout(() => setActionSuccess(null), 4000);
      closeModal();
      await fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Origin: window.location.origin,
        },
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error?.message || "Could not delete category.");
      }

      setActionSuccess(`Category "${deleteTarget.name}" deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || "Could not delete category.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActiveStatus = async (cat: CategoryItem) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to update category status.");
      }
      await fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)]">
            Category Management
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Taxonomy and ordering of products across the SPN Foods catalogue
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)] transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Category</span>
        </button>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-stone-200 animate-pulse rounded" />
          <div className="h-10 bg-stone-100 animate-pulse rounded" />
          <div className="h-10 bg-stone-100 animate-pulse rounded" />
          <div className="h-10 bg-stone-100 animate-pulse rounded" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-lg border border-rose-200 bg-rose-50 text-rose-800">
          <h2 className="text-sm font-semibold mb-1">Failed to load categories</h2>
          <p className="text-xs mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchCategories}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-700 text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Categories Table */}
      {!loading && !error && categories.length === 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">No categories have been created yet.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)]"
          >
            Create First Category
          </button>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-warm)]/60 border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-medium">
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4">Name &amp; Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[var(--color-surface-warm)]/30 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-[var(--color-text-muted)]">
                      {cat.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--color-text-primary)] text-sm">
                        {cat.name}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        /{cat.slug}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                        {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActiveStatus(cat)}
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                        }`}
                        title="Click to toggle status"
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="px-2.5 py-1 rounded text-xs font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-warm)] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="px-2.5 py-1 rounded text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text-primary)]">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="cat-name" className="block font-medium text-[var(--color-text-primary)] mb-1">
                  Category Name *
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Traditional Health Mixes"
                  className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] text-sm"
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className="block font-medium text-[var(--color-text-primary)] mb-1">
                  URL Slug (Optional — auto-generated if blank)
                </label>
                <input
                  id="cat-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. health-mixes"
                  className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] font-mono text-xs"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="block font-medium text-[var(--color-text-primary)] mb-1">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description displayed in storefront headers"
                  className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cat-order" className="block font-medium text-[var(--color-text-primary)] mb-1">
                    Sort Order
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]/40 focus:outline-none focus:border-[var(--color-brand-primary)] text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-[var(--color-border-subtle)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                    />
                    <span className="font-medium text-[var(--color-text-primary)]">
                      Visible in Store
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formSubmitting}
                  className="px-3 py-2 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)] font-semibold transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg max-w-sm w-full p-6 shadow-lg">
            <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-rose-800 mb-2">
              Delete Category
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Are you sure you want to delete <span className="font-semibold text-[var(--color-text-primary)]">"{deleteTarget.name}"</span>?
              {deleteTarget.productCount > 0 ? (
                <span className="block mt-2 font-medium text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  Warning: This category has {deleteTarget.productCount} associated product(s). The database will prevent deletion until they are moved or deleted. Consider deactivating instead.
                </span>
              ) : (
                <span className="block mt-2 text-[var(--color-text-muted)]">
                  This category has 0 products and can be safely removed.
                </span>
              )}
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
                {deleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
