"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RatingSummaryCard } from "./rating-summary-card";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import type {
  CustomerReviewEligibility,
  PaginatedReviews,
  ProductRatingSummary,
  PublicReview,
} from "@/lib/reviews/types";

interface ProductReviewsSectionProps {
  productSlug: string;
  initialSummary?: ProductRatingSummary;
}

export function ProductReviewsSection({
  productSlug,
  initialSummary,
}: ProductReviewsSectionProps) {
  const [reviewsData, setReviewsData] = useState<PaginatedReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");
  const [page, setPage] = useState(1);

  // Customer eligibility & form state
  const [eligibility, setEligibility] = useState<CustomerReviewEligibility | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<PublicReview | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // 1. Fetch public reviews list
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      params.set("sort", sortBy);
      if (selectedRating) params.set("rating", String(selectedRating));

      const res = await fetch(`/api/catalogue/products/${productSlug}/reviews?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Unable to load reviews.");
      }
      const data: PaginatedReviews = await res.json();
      setReviewsData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productSlug, page, selectedRating, sortBy]);

  // 2. Fetch customer eligibility
  const checkEligibility = useCallback(async () => {
    try {
      const res = await fetch(`/api/catalogue/products/${productSlug}/reviews/eligibility`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data: CustomerReviewEligibility = await res.json();
        setEligibility(data);
      } else {
        setEligibility(null);
      }
    } catch {
      setEligibility(null);
    }
  }, [productSlug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleReviewSuccess = (savedReview: PublicReview) => {
    setShowForm(false);
    setEditingReview(null);
    setNotification(
      editingReview
        ? "Your review was successfully updated."
        : "Thank you! Your review has been submitted.",
    );
    setTimeout(() => setNotification(null), 5000);
    // Refresh both list and customer eligibility
    fetchReviews();
    checkEligibility();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/me/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review.");
      setNotification("Your review has been removed.");
      setTimeout(() => setNotification(null), 4000);
      fetchReviews();
      checkEligibility();
    } catch (err: any) {
      setError(err.message || "Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = reviewsData?.summary ?? initialSummary ?? {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  const isEligibleToReview = eligibility?.canReview ?? false;
  const existingReview = eligibility?.existingReview;

  return (
    <section id="reviews" className="mt-14 lg:mt-20 scroll-mt-24">
      <div className="border-t border-[var(--color-border)] pt-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-normal text-[var(--color-text-primary)] font-heading">
              Customer Reviews & Ratings
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Real feedback from verified purchasers and health mix enthusiasts.
            </p>
          </div>

          {!showForm && isEligibleToReview && (
            <button
              type="button"
              onClick={() => {
                setEditingReview(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] text-sm font-semibold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.98] transition-all shadow-sm font-[family-name:var(--font-body)]"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Success / Notification banner */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between animate-fade-in">
            <span className="font-medium">{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
            >
              ×
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold ml-3"
            >
              ×
            </button>
          </div>
        )}

        {/* Review Form Drawer */}
        {showForm && (
          <div className="mb-10">
            <ReviewForm
              productSlug={productSlug}
              initialReview={editingReview}
              verifiedPurchase={eligibility?.verifiedPurchase}
              onSuccess={handleReviewSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingReview(null);
              }}
            />
          </div>
        )}

        {/* Existing review banner if customer already reviewed */}
        {existingReview && !showForm && (
          <div className="mb-8 p-5 bg-[#ECC484]/15 border border-[#ECC484]/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#824629]">
                  Your Submitted Review
                </span>
                {existingReview.status === "pending" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    Pending Moderation
                  </span>
                )}
                {existingReview.verifiedPurchase && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Verified Purchase
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
                {existingReview.title || `${existingReview.rating} out of 5 stars`}
              </p>
              <p className="text-xs text-[var(--color-text-body)] line-clamp-2 mt-0.5">
                {existingReview.body}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingReview({
                    id: existingReview.id,
                    rating: existingReview.rating,
                    title: existingReview.title,
                    body: existingReview.body,
                    authorName: "You",
                    verifiedPurchase: existingReview.verifiedPurchase,
                    createdAt: existingReview.createdAt,
                  });
                  setShowForm(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#824629] bg-white border border-[#ECC484] rounded-lg hover:bg-[#ECC484]/20 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReview(existingReview.id)}
                disabled={deletingId === existingReview.id}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Rating summary score and distribution card */}
        <div className="mb-10">
          <RatingSummaryCard
            summary={summary}
            selectedRating={selectedRating}
            onSelectRating={(r) => {
              setSelectedRating(r);
              setPage(1);
            }}
            onWriteReviewClick={
              isEligibleToReview
                ? () => {
                    setEditingReview(null);
                    setShowForm(true);
                  }
                : undefined
            }
            canReview={isEligibleToReview && !showForm}
          />
        </div>

        {/* Filter and Sort bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[var(--color-border)] mb-6">
          {/* Rating filter pills — Mobile Horizontal Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setSelectedRating(undefined);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedRating === undefined
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "bg-[var(--color-surface-sunken)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]/40"
              }`}
            >
              All Reviews ({summary.totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.distribution[stars as keyof typeof summary.distribution] || 0;
              const isSelected = selectedRating === stars;
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => {
                    setSelectedRating(isSelected ? undefined : stars);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 flex items-center gap-1 ${
                    isSelected
                      ? "bg-[var(--color-brand-primary)] text-white"
                      : "bg-[var(--color-surface-sunken)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]/40"
                  }`}
                >
                  <span>{stars}★</span>
                  <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="sort-reviews" className="text-xs font-semibold text-[var(--color-text-muted)]">
              Sort by:
            </label>
            <select
              id="sort-reviews"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[8px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Review Cards List */}
        {loading ? (
          <div className="py-16 text-center text-[var(--color-text-muted)]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-brand-primary)] border-t-transparent mb-3" />
            <p className="text-sm font-medium">Loading reviews...</p>
          </div>
        ) : !reviewsData || reviewsData.reviews.length === 0 ? (
          <div className="py-16 text-center px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center text-[var(--color-text-muted)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {selectedRating ? `No ${selectedRating}-star reviews yet` : "No reviews yet"}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
              {selectedRating
                ? "Try selecting another rating or viewing all reviews."
                : "Be the first to share your honest thoughts about this product!"}
            </p>

            {isEligibleToReview && !showForm && (
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setShowForm(true);
                }}
                className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] text-sm font-semibold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] transition-all shadow-sm font-[family-name:var(--font-body)]"
              >
                Write the First Review
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsData.reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isOwnReview={existingReview?.id === r.id}
                onEdit={() => {
                  setEditingReview(r);
                  setShowForm(true);
                }}
                onDelete={handleDeleteReview}
                isDeleting={deletingId === r.id}
              />
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {reviewsData && reviewsData.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
            <div>
              Page {reviewsData.page} of {reviewsData.totalPages} ({reviewsData.total} total reviews)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3.5 py-1.5 border border-[var(--color-border)] rounded-lg font-medium text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(reviewsData.totalPages, p + 1))}
                disabled={page >= reviewsData.totalPages || loading}
                className="px-3.5 py-1.5 border border-[var(--color-border)] rounded-lg font-medium text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
