"use client";

import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { PriceDisplay } from "./price-display";
import { useCart } from "@/context/cart-context";
import type { ProductDetail, ProductVariant } from "@/lib/storefront/types";

interface ProductPurchasePanelProps {
  product: ProductDetail;
  initialVariantId?: string;
}

export function ProductPurchasePanel({ product, initialVariantId }: ProductPurchasePanelProps) {
  const { addItem, isVariantMutating } = useCart();

  // If a specific variant was passed (e.g. from homepage selection), use it if found
  const requestedVariant = initialVariantId
    ? product.variants.find((v) => v.id === initialVariantId)
    : undefined;

  // Default to requested variant, or first in-stock variant, or first variant
  const initialVariant =
    requestedVariant ??
    product.variants.find((v) => v.inStock) ??
    product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    initialVariant
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isThisVariantMutating = selectedVariant?.id ? isVariantMutating(selectedVariant.id) : false;
  const isBusy = adding || isThisVariantMutating;

  if (!selectedVariant) {
    return (
      <div className="my-6 p-4 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
        <p className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Pricing unconfigured
        </p>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-text-muted)] leading-relaxed">
          Packaging sizes and pricing are currently being updated. Online purchasing is disabled until valid variants are configured.
        </p>
      </div>
    );
  }

  const maxQty = selectedVariant.inStock
    ? Math.min(selectedVariant.maxQuantity || 99, 99)
    : 0;

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (quantity > (v.maxQuantity || 99)) {
      setQuantity(Math.max(1, v.maxQuantity || 1));
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant.inStock || isBusy) return;
    setAdding(true);
    try {
      const success = await addItem(selectedVariant.id, quantity);
      if (success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {/* Price block for selected variant */}
      <div className="mb-5">
        <PriceDisplay
          pricePaise={selectedVariant.pricePaise}
          mrpPaise={selectedVariant.mrpPaise}
          discountPercent={selectedVariant.discountPercent}
          size="lg"
        />
      </div>

      <div className="border-t border-[var(--color-border)] mb-5" />

      {/* Variant picker */}
      {product.variants.length > 0 && (
        <div className="mb-5">
          <p className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-primary)] mb-2.5">
            Pack Size
          </p>
          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="Select pack size"
          >
            {product.variants.map((variant) => {
              const isSelected = selectedVariant.id === variant.id;
              const formattedPrice = `₹${(variant.pricePaise / 100).toLocaleString("en-IN")}`;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantSelect(variant)}
                  disabled={!variant.inStock}
                  className={[
                    "min-h-[40px] sm:min-h-[44px] py-2 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 font-[family-name:var(--font-body)] text-xs sm:text-sm rounded-[6px] border transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)] cursor-pointer",
                    isSelected
                      ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary-dark)] font-semibold shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-body)] hover:border-[var(--color-brand-primary)]",
                    !variant.inStock && "opacity-40 line-through cursor-not-allowed",
                  ].filter(Boolean).join(" ")}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!variant.inStock}
                  title={!variant.inStock ? `${variant.label} — out of stock` : `${variant.label} — ${formattedPrice}`}
                >
                  <span>{variant.label}</span>
                  <span className={isSelected ? "font-[family-name:var(--font-price)] text-[var(--color-brand-primary-dark)] font-semibold text-xs" : "font-[family-name:var(--font-price)] text-[var(--color-text-muted)] text-xs"}>
                    — {formattedPrice}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      <div className="mb-5">
        {selectedVariant.lowStock && selectedVariant.inStock && (
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-warning)] flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-[var(--color-warning)] inline-block flex-shrink-0"
              aria-hidden
            />
            Only {selectedVariant.maxQuantity} left
          </p>
        )}
        {!selectedVariant.inStock && (
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)] font-medium">
            Out of stock
          </p>
        )}
      </div>

      {/* Add to Cart Section */}
      {selectedVariant.inStock && (
        <div className="mb-6">
          {/* Quantity picker */}
          <div className="flex items-center gap-3 mb-4">
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-primary)]">
              Qty
            </p>
            <div className="flex items-center border border-[var(--color-border)] rounded-[8px] bg-[var(--color-surface)] overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isBusy}
                className="h-10 w-10 flex items-center justify-center text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] active:bg-[var(--color-border)] transition-colors font-[family-name:var(--font-body)] text-lg disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)]"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                className="h-10 w-12 flex items-center justify-center font-[family-name:var(--font-price)] font-semibold text-sm text-[var(--color-text-primary)] border-x border-[var(--color-border)] select-none"
                aria-label={`Quantity: ${quantity}`}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty || isBusy}
                className="h-10 w-10 flex items-center justify-center text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] active:bg-[var(--color-border)] transition-colors font-[family-name:var(--font-body)] text-lg disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)]"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isBusy}
            className={[
              "w-full h-12 flex items-center justify-center gap-2 font-[family-name:var(--font-body)] font-semibold text-base text-white rounded-[8px] active:scale-[0.98] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] disabled:opacity-75 cursor-pointer shadow-xs",
              added
                ? "bg-[var(--color-success)] shadow-md"
                : "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)]",
            ].join(" ")}
            aria-label={`Add ${product.name} (${selectedVariant.label}) to cart`}
            aria-live="polite"
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Adding to Cart...</span>
              </>
            ) : added ? (
              <>
                <Check className="h-5 w-5 text-white stroke-[2.5]" aria-hidden="true" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
