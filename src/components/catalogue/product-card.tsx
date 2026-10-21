"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import type { ProductCard as ProductCardType, ProductVariant } from "@/lib/storefront/types";

interface ProductCardProps {
  product: ProductCardType;
  className?: string;
  priority?: boolean;
}

/**
 * Controlled two-line formatting for specific storefront product card titles.
 * Ensures consistent line breaks across responsive views and screen sizes.
 */
export const PRODUCT_CARD_TWO_LINE_TITLES: Record<string, [string, string]> = {
  "nendram-raw-banana-powder": ["Nendram Raw", "Banana Powder"],
  "karuppu-kavuni-kanji-mix": ["Karuppu Kavuni", "Kanji Mix"],
  "abc-malt-nuts-mixed-powder": ["ABC Malt -", "Nuts Mixed Powder"],
  "moringa-leaves-sadham-podi": ["Moringa Leaves", "Sadham Podi"],
  "karuveppilai-sadham-podi": ["Karuveppilai", "Sadham Podi"],
};

export function renderProductCardTitle(slug?: string, name?: string): React.ReactNode {
  if (slug && PRODUCT_CARD_TWO_LINE_TITLES[slug]) {
    const [line1, line2] = PRODUCT_CARD_TWO_LINE_TITLES[slug];
    return (
      <>
        <span className="block">{line1}</span>
        <span className="block">{line2}</span>
      </>
    );
  }

  // Fallback matching by name in case product object has alternate slug casing
  const clean = (name ?? "").toLowerCase().replace(/[\u2013\u2014-]/g, " ");
  if (clean.includes("nendram") && clean.includes("banana")) {
    return (
      <>
        <span className="block">Nendram Raw</span>
        <span className="block">Banana Powder</span>
      </>
    );
  }
  if (clean.includes("karuppu") && clean.includes("kavuni")) {
    return (
      <>
        <span className="block">Karuppu Kavuni</span>
        <span className="block">Kanji Mix</span>
      </>
    );
  }
  if (clean.includes("abc") && clean.includes("malt")) {
    return (
      <>
        <span className="block">ABC Malt -</span>
        <span className="block">Nuts Mixed Powder</span>
      </>
    );
  }
  if (clean.includes("moringa") && clean.includes("sadham")) {
    return (
      <>
        <span className="block">Moringa Leaves</span>
        <span className="block">Sadham Podi</span>
      </>
    );
  }
  if (clean.includes("karuveppilai") && clean.includes("sadham")) {
    return (
      <>
        <span className="block">Karuveppilai</span>
        <span className="block">Sadham Podi</span>
      </>
    );
  }

  return name;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { slug, name, category, image, variants = [], inStock } = product;
  const { cart, addItem, updateQuantity, removeItem, isVariantMutating } = useCart();

  // Default to first in-stock variant, or first variant if all out of stock
  const initialVariant = variants.find((v) => v.inStock) ?? variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(initialVariant);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const productHref = `/products/${slug}${selectedVariant ? `?variant=${selectedVariant.id}` : ""}`;

  // Real MRP / Selling price from currently selected variant or product base
  const activePricePaise = selectedVariant?.pricePaise ?? (product as any)?.price?.fromPaise ?? 0;
  const activeMrpPaise = selectedVariant?.mrpPaise ?? (product as any)?.price?.fromMrpPaise ?? 0;
  const displayPrice = activePricePaise > 0 ? formatPrice(activePricePaise) : activeMrpPaise > 0 ? formatPrice(activeMrpPaise) : null;

  // Genuine verified discount from database only
  const hasGenuineDiscount = Boolean(
    activeMrpPaise > activePricePaise &&
    selectedVariant?.discountPercent &&
    selectedVariant.discountPercent > 0
  );
  const originalMrp = hasGenuineDiscount ? formatPrice(activeMrpPaise) : null;

  // Current quantity of selected variant in cart (0 if not added)
  const cartItem = cart?.items?.find((item) => item.variantId === selectedVariant?.id);
  const currentQty = cartItem?.quantity ?? 0;

  // Scoped loading state: only this card and this specific variant
  const isThisVariantMutating = selectedVariant?.id ? isVariantMutating(selectedVariant.id) : false;
  const isBusy = isPending || isThisVariantMutating;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || !selectedVariant.inStock || isBusy) return;
    setIsPending(true);
    try {
      await addItem(selectedVariant.id, 1);
    } finally {
      setIsPending(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || isBusy) return;
    setIsPending(true);
    try {
      await updateQuantity(selectedVariant.id, currentQty + 1);
    } finally {
      setIsPending(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || isBusy) return;
    setIsPending(true);
    try {
      if (currentQty <= 1) {
        await removeItem(selectedVariant.id);
      } else {
        await updateQuantity(selectedVariant.id, currentQty - 1);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <article
      className={cn(
        "group flex flex-col h-full bg-white rounded-[20px] border border-[#E8DFD4] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#BF5330]/40 transition-all duration-200 overflow-hidden",
        className
      )}
      aria-label={name}
    >
      {/* 1. Large Top Product Image with Wishlist Button */}
      <div className="relative w-full aspect-[4/3] bg-[#FAF5EE] overflow-hidden">
        <Link
          href={productHref}
          prefetch={false}
          className="relative block w-full h-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image?.url ? (
            <Image
              src={image.url}
              alt={image.alt ?? name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-out"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-[#FAF5EE]"
              aria-hidden="true"
            >
              <span className="font-heading text-4xl font-normal text-[#D4C5B5] select-none">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Wishlist control button in upper-right corner */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((prev) => !prev);
          }}
          className={cn(
            "absolute top-3.5 right-3.5 z-10 w-9.5 h-9.5 rounded-full bg-white shadow-xs border border-[#E8DFD4]/80 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330]",
            isWishlisted
              ? "text-[#BF5330]"
              : "text-[#1A1614] hover:text-[#BF5330]"
          )}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        >
          <Heart
            className={cn(
              "w-4.5 h-4.5 transition-colors",
              isWishlisted && "fill-[#BF5330] text-[#BF5330]"
            )}
            aria-hidden="true"
          />
        </button>

        {/* Subtle Out of Stock badge overlay if entire product is unavailable */}
        {!inStock ? (
          <div className="absolute inset-0 bg-[#FAF5EE]/75 backdrop-blur-[2px] flex items-end p-3 pointer-events-none">
            <span className="font-[family-name:var(--font-body)] text-[11px] font-semibold text-[#635850] bg-white rounded-[6px] px-2.5 py-1 border border-[#E8DFD4] shadow-xs">
              Out of stock
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Structured Card Body */}
      <div className="p-5 sm:p-5.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Small Uppercase Category Label */}
          {category?.name ? (
            <p className="font-[family-name:var(--font-body)] text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#BF5330] mb-1.5 line-clamp-1">
              {category.name}
            </p>
          ) : null}

          {/* Editorial Product Name in DM Serif Display */}
          <h3 className="font-[family-name:var(--font-heading)] text-[20px] sm:text-[22px] font-normal leading-[1.24] text-[#1A1614] mb-2 min-h-[3.1rem] line-clamp-2">
            <Link
              href={productHref}
              prefetch={false}
              className="hover:text-[#BF5330] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330] rounded block"
            >
              {renderProductCardTitle(slug, name)}
            </Link>
          </h3>

          {/* Helper Text */}
          <p className="font-[family-name:var(--font-body)] text-[13px] sm:text-[13.5px] text-[#635850] mb-2.5">
            Select your pack
          </p>

          {/* Dynamic Pack-Size Selector with real variants only - Single horizontal row without truncation */}
          {variants.length > 0 ? (
            <div
              className={cn(
                "flex items-stretch mb-3.5 min-h-[34px] sm:min-h-[36px] w-full",
                variants.length >= 5
                  ? "gap-1 sm:gap-1.5"
                  : variants.length === 4
                  ? "gap-1.5 sm:gap-2"
                  : "gap-2"
              )}
              role="radiogroup"
              aria-label={`Available pack sizes for ${name}`}
            >
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const isDense = variants.length >= 5;
                const isFour = variants.length === 4;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!variant.inStock}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "flex-1 min-w-0 rounded-[8px] flex items-center justify-center text-center font-[family-name:var(--font-body)] transition-all cursor-pointer border select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330]",
                      isDense
                        ? "px-0.5 sm:px-1 py-1.5 text-[10.5px] xs:text-[11px] sm:text-[11.5px] lg:text-[12px] tracking-tight"
                        : isFour
                        ? "px-1 sm:px-1.5 py-1.5 text-[11px] xs:text-[11.5px] sm:text-[12px] lg:text-[12.5px]"
                        : "px-1.5 sm:px-2 py-1.5 text-[12px] sm:text-[12.5px] lg:text-[13px]",
                      isSelected
                        ? "bg-[#FDF3EE] border-[#BF5330] text-[#BF5330] font-semibold shadow-2xs"
                        : "bg-[#FFFBF7] border-[#E8DFD4] text-[#1A1614] font-normal hover:border-[#BF5330]/50 hover:bg-[#FAF4ED] hover:text-[#BF5330]",
                      !variant.inStock &&
                        "opacity-40 cursor-not-allowed line-through hover:border-[#E8DFD4] hover:bg-[#FFFBF7] hover:text-[#1A1614]"
                    )}
                  >
                    <span>{variant.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="min-h-[34px] sm:min-h-[36px] mb-3.5 flex items-center">
              <span className="font-[family-name:var(--font-body)] text-xs text-[#635850]/70 italic">
                View product details
              </span>
            </div>
          )}

          {/* 3. Actual MRP / Real Price: Crisp, sharp Manrope ExtraBold (weight 800) */}
          <div className="flex items-baseline gap-2 mb-3.5 min-h-[28px]">
            {displayPrice ? (
              <>
                <span className="font-[family-name:var(--font-price)] font-extrabold text-[22px] sm:text-[24px] text-[#1A1614] tracking-tight leading-none">
                  {displayPrice}
                </span>
                {hasGenuineDiscount && originalMrp ? (
                  <span className="font-[family-name:var(--font-price)] text-[13px] sm:text-[14px] text-[#635850] line-through font-normal">
                    {originalMrp}
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {/* 4. Action Buttons: Stacked Full-Width Add to Cart & View Details */}
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full mt-auto pt-1">
          {variants.length > 0 ? (
            <>
              {/* Row 1: Add to Cart button (when 0 in cart) or - (No) + Stepper (when > 0 in cart) */}
              {currentQty === 0 ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant?.inStock || isBusy}
                  className={cn(
                    "w-full bg-[#BF5330] hover:bg-[#8F3E20] text-white h-[42px] sm:h-[44px] rounded-[4px] font-[family-name:var(--font-body)] text-[13.5px] sm:text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330] cursor-pointer",
                    (!selectedVariant?.inStock || isBusy) && "opacity-60 cursor-not-allowed"
                  )}
                  aria-label={`Add ${name}${selectedVariant?.label ? ` - ${selectedVariant.label}` : ""} to cart`}
                >
                  <ShoppingCart className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
                  <span>{isBusy ? "Adding..." : "Add to Cart"}</span>
                </button>
              ) : (
                <div
                  className="w-full h-[42px] sm:h-[44px] rounded-[4px] bg-[#BF5330] text-white flex items-center justify-between px-2 shadow-xs select-none"
                  role="group"
                  aria-label={`Quantity in cart for ${name} (${selectedVariant?.label})`}
                >
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={isBusy}
                    className="h-8 w-9 sm:h-8.5 sm:w-10 rounded-[3px] flex items-center justify-center hover:bg-[#8F3E20] active:scale-95 transition-all text-white cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                    aria-label={`Decrease quantity of ${name} (${selectedVariant?.label})`}
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  </button>

                  <span className="font-[family-name:var(--font-price)] font-extrabold text-[15px] sm:text-[16px] text-white select-none px-2 tracking-tight">
                    {currentQty}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={
                      isBusy ||
                      (selectedVariant?.maxQuantity ? currentQty >= selectedVariant.maxQuantity : currentQty >= 99)
                    }
                    className="h-8 w-9 sm:h-8.5 sm:w-10 rounded-[3px] flex items-center justify-center hover:bg-[#8F3E20] active:scale-95 transition-all text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                    aria-label={`Increase quantity of ${name} (${selectedVariant?.label})`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Row 2: Full-width View Details button */}
              <Link
                href={productHref}
                prefetch={false}
                className="w-full bg-[#FFFBF7] hover:bg-[#FAF4ED] text-[#1A1614] hover:text-[#BF5330] border border-[#E8DFD4] hover:border-[#BF5330]/40 h-[42px] sm:h-[44px] rounded-[4px] font-[family-name:var(--font-body)] text-[13.5px] sm:text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330] group/btn"
                aria-label={`View details and options for ${name}`}
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <Link
              href={productHref}
              prefetch={false}
              className="w-full bg-[#BF5330] hover:bg-[#8F3E20] text-white h-[42px] sm:h-[44px] rounded-[4px] font-[family-name:var(--font-body)] text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330]"
              aria-label={`Choose options for ${name}`}
            >
              <span>Choose options</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton variant matching Featured Bestseller card ─────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col h-full bg-white rounded-[20px] border border-[#E8DFD4] overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="bg-[#FAF5EE] aspect-[4/3] w-full" />
      <div className="p-5 sm:p-5.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="h-3 w-20 bg-[#FAF5EE] rounded mb-2" />
          <div className="h-5 w-4/5 bg-[#FAF5EE] rounded mb-2" />
          <div className="h-5 w-2/3 bg-[#FAF5EE] rounded mb-4" />
          <div className="h-3 w-28 bg-[#FAF5EE] rounded mb-2.5" />
          <div className="flex gap-1.5 sm:gap-2 mb-3.5 w-full">
            <div className="h-8 flex-1 min-w-0 bg-[#FAF5EE] rounded-[8px]" />
            <div className="h-8 flex-1 min-w-0 bg-[#FAF5EE] rounded-[8px]" />
            <div className="h-8 flex-1 min-w-0 bg-[#FAF5EE] rounded-[8px]" />
          </div>
          <div className="h-7 w-20 bg-[#FAF5EE] rounded mb-3.5" />
        </div>
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full mt-auto pt-1">
          <div className="h-[42px] sm:h-[44px] w-full bg-[#FAF5EE] rounded-[4px]" />
          <div className="h-[42px] sm:h-[44px] w-full bg-[#FAF5EE] rounded-[4px]" />
        </div>
      </div>
    </div>
  );
}
