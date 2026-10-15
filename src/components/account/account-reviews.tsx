"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { RatingStars } from "@/components/reviews/rating-stars";
import type { ReviewStatus } from "@/lib/reviews/types";

interface CustomerReviewItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
}

export function AccountReviews() {
  const [reviews, setReviews] = useState<CustomerReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit modal
  const [editingReview, setEditingReview] = useState<CustomerReviewItem | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/reviews", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load your reviews.");
      }
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const handleOpenEdit = (r: CustomerReviewItem) => {
    setEditingReview(r);
    setEditRating(r.rating);
    setEditTitle(r.title || "");
    setEditBody(r.body || "");
    setSaveError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (editRating < 1 || editRating > 5) {
      setSaveError("Rating must be between 1 and 5.");
      return;
    }
    if (editBody.trim().length < 3) {
      setSaveError("Review must be at least 3 characters.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/me/reviews/${editingReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          title: editTitle.trim() || null,
          body: editBody.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to update review.");
      }

      const updated = await res.json();
      setReviews((prev) =>
        prev.map((it) =>
          it.id === editingReview.id
            ? {
                ...it,
                rating: updated.rating,
                title: updated.title,
                body: updated.body,
                status: updated.status,
              }
            : it,
        ),
      );
      setActionSuccess("Review successfully updated.");
      setTimeout(() => setActionSuccess(null), 4000);
      setEditingReview(null);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/me/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setActionSuccess("Review deleted.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">
          My Reviews & Ratings
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          View, edit, or manage the product reviews you’ve shared with the SPN Foods community.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-brand-primary)] border-t-transparent mb-3" />
          <p className="text-sm text-[var(--color-text-muted)] font-medium font-[family-name:var(--font-body)]">Loading your reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px]">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--color-turmeric-gold)]/20 flex items-center justify-center text-[var(--color-brand-primary)]">
            <Star className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">
            No reviews yet
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto font-[family-name:var(--font-body)]">
            You haven’t reviewed any products yet. After receiving your orders, share your thoughts to help other shoppers!
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] transition-colors shadow-xs font-[family-name:var(--font-body)]"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const formattedDate = new Date(r.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={r.id}
                className="p-5 sm:p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px] shadow-xs space-y-3 font-[family-name:var(--font-body)]"
              >
                {/* Header: Product link, status, verified */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]/60">
                  <div>
                    <Link
                      href={`/products/${r.productSlug}`}
                      className="font-bold text-base text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] hover:underline transition-colors"
                    >
                      {r.productName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingStars rating={r.rating} size="sm" />
                      <time dateTime={r.createdAt} className="text-xs text-[var(--color-text-muted)]">
                        {formattedDate}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Purchase
                      </span>
                    )}

                    {r.status === "published" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Published
                      </span>
                    ) : r.status === "pending" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending Moderation
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  {r.title && (
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {r.title}
                    </h4>
                  )}
                  <p className="text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
                    {r.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="px-3.5 py-1.5 font-semibold text-[#824629] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg transition-colors"
                  >
                    Edit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="px-3.5 py-1.5 font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === r.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">
                  Edit Your Review
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {editingReview.productName}
                </p>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl font-bold"
              >
                ×
              </button>
            </div>

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                  Rating (1–5)
                </label>
                <div className="flex items-center gap-3">
                  <RatingStars rating={editRating} interactive size="lg" onChange={setEditRating} />
                  <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                    {editRating} Star{editRating > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Title (optional)
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {editTitle.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={editTitle}
                  maxLength={100}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[8px] focus:outline-none focus:border-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Review Text
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {editBody.length}/2000
                  </span>
                </div>
                <textarea
                  value={editBody}
                  maxLength={2000}
                  rows={4}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[8px] focus:outline-none focus:border-[var(--color-brand-primary)] leading-relaxed resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] rounded-[8px] transition-colors shadow-xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
