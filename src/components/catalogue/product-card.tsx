"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/lib/storefront/types";
import { PriceDisplay } from "./price-display";

interface ProductCardProps {
  product: ProductCardType;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { slug, name, price, inStock, image, hasMultipleSizes } = product;
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[16px] sm:rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] p-3 sm:p-3.5 transition-all duration-200 hover:shadow-xs hover:-translate-y-0.5",
        className
      )}
      aria-label={name}
    >
      {/* 1. Primary Product Image with Wishlist Button */}
      <div className="relative overflow-hidden rounded-[12px] sm:rounded-[14px] bg-[var(--color-surface-sunken)] aspect-[4/3] sm:aspect-square mb-2.5 sm:mb-3">
        <Link
          href={`/products/${slug}`}
          prefetch={false}
          className="block absolute inset-0"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 285px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            /* Fallback initial mark when image is absent */
            <div
              className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-sunken)]"
              aria-hidden="true"
            >
              <span className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-bold text-[var(--color-border-strong)] select-none">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Wishlist control */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((prev) => !prev);
          }}
          className={cn(
            "absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[var(--color-border)] flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)]",
            isWishlisted
              ? "text-[var(--color-brand-primary)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
          )}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        >
          <Heart
            className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isWishlisted && "fill-current text-[var(--color-brand-primary)]")}
            aria-hidden="true"
          />
        </button>

        {/* Genuine Discount badge — only rendered if verified discount exists */}
        {price.fromPaise !== null && price.discountPercent > 0 ? (
          <div
            className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 font-[family-name:var(--font-body)] font-semibold text-[10px] sm:text-[10.5px] text-white bg-[var(--color-brand-primary)] rounded-full px-1.5 sm:px-2 py-0.5 leading-none shadow-xs"
            aria-label={`${price.discountPercent}% discount`}
          >
            {price.discountPercent}% off
          </div>
        ) : null}

        {/* Out of stock overlay */}
        {price.fromPaise !== null && !inStock ? (
          <div className="absolute inset-0 bg-[var(--color-surface-raised)]/75 backdrop-blur-[2px] flex items-end p-2 sm:p-2.5 pointer-events-none">
            <span className="font-[family-name:var(--font-body)] text-[10.5px] sm:text-[11px] font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] rounded-[6px] px-2 py-0.5 border border-[var(--color-border)] shadow-xs">
              Out of stock
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Structured Information Hierarchy */}
      <div className="flex flex-col flex-1">
        {/* Category tag */}
        {product.category?.name ? (
          <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)] px-0.5 mb-1 line-clamp-1">
            {product.category.name}
          </p>
        ) : null}

        {/* Product title */}
        <div className="min-h-[2.3rem] sm:min-h-[2.5rem] mb-2 px-0.5">
          <Link
            href={`/products/${slug}`}
            prefetch={false}
            className="font-[family-name:var(--font-body)] text-[14px] sm:text-[15px] font-semibold leading-[1.3] text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] transition-colors line-clamp-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)] rounded"
          >
            {name}
          </Link>
        </div>

        {/* 3. Price & Add-to-Cart Action */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 sm:pt-3 px-0.5 border-t border-[var(--color-border)]">
          {price.fromPaise !== null ? (
            <>
              <PriceDisplay
                pricePaise={price.fromPaise}
                mrpPaise={price.fromMrpPaise ?? undefined}
                discountPercent={price.discountPercent}
                size="sm"
                prefix={hasMultipleSizes ? "From " : undefined}
              />

              {inStock ? (
                <Link
                  href={`/products/${slug}`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.97] transition-all text-[11.5px] sm:text-[12px] font-medium shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)]"
                  aria-label={`Add ${name} to cart`}
                  title={`Add ${name} to cart`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Add to Cart</span>
                </Link>
              ) : (
                <span className="text-[11.5px] text-[var(--color-text-muted)] font-medium">
                  Sold Out
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-medium text-[var(--color-text-muted)] py-1">
              Pricing unconfigured
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton variant ────────────────────────────────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-[16px] sm:rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-3 sm:p-3.5 animate-pulse"
      aria-hidden="true"
    >
      <div className="bg-[var(--color-surface-sunken)] aspect-[4/3] sm:aspect-square rounded-[12px] mb-2.5 sm:mb-3" />
      <div className="flex flex-col flex-1">
        <div className="h-3 w-16 bg-[var(--color-surface-sunken)] rounded mb-1.5" />
        <div className="h-4 w-full bg-[var(--color-surface-sunken)] rounded mb-1.5" />
        <div className="h-4 w-2/3 bg-[var(--color-surface-sunken)] rounded mb-4" />
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5 sm:pt-3 mt-auto">
          <div className="h-5 w-20 bg-[var(--color-surface-sunken)] rounded" />
          <div className="h-7 w-20 bg-[var(--color-surface-sunken)] rounded-full" />
        </div>
      </div>
    </div>
  );
}
