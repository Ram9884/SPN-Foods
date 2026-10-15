"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BestsellerProduct, ProductVariant } from "@/lib/storefront/types";

interface FeaturedProductCardProps {
  product: BestsellerProduct;
  priority?: boolean;
}

export function FeaturedProductCard({ product, priority = false }: FeaturedProductCardProps) {
  const { slug, name, category, image, variants } = product;

  // Default to first in-stock variant, or first variant if all out of stock
  const initialVariant = variants.find((v) => v.inStock) ?? variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(initialVariant);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productHref = `/products/${slug}${selectedVariant ? `?variant=${selectedVariant.id}` : ""}`;

  return (
    <article
      className="group flex flex-col h-full bg-white rounded-[20px] border border-[#E8DFD4] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_22px_rgba(0,0,0,0.06)] hover:border-[#BF5330]/40 transition-all duration-200 overflow-hidden"
      aria-label={name}
    >
      {/* 1. Large Top Product Image with Wishlist Button */}
      <div className="relative w-full aspect-[4/3] bg-[#FAF5EE] overflow-hidden">
        <Link
          href={productHref}
          prefetch={false}
          className="block w-full h-full"
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
              <span className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#D4C5B5] select-none">
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
        {!product.inStock ? (
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

          {/* Editorial Product Name */}
          <h3 className="font-[family-name:var(--font-heading)] text-[20px] sm:text-[22px] font-normal leading-[1.22] text-[#1A1614] mb-2 min-h-[3.1rem] line-clamp-2">
            <Link
              href={productHref}
              prefetch={false}
              className="hover:text-[#BF5330] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330] rounded"
            >
              {name}
            </Link>
          </h3>

          {/* Helper Text */}
          <p className="font-[family-name:var(--font-body)] text-[13px] sm:text-[13.5px] text-[#635850] mb-3">
            Select your pack
          </p>

          {/* Dynamic Pack-Size Selector */}
          {variants.length > 0 ? (
            <div
              className="flex flex-wrap items-stretch gap-2 mb-4.5 min-h-[38px]"
              role="radiogroup"
              aria-label={`Available pack sizes for ${name}`}
            >
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!variant.inStock}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "flex-1 min-w-[62px] py-2 px-2.5 rounded-[8px] text-center font-[family-name:var(--font-body)] text-[12.5px] sm:text-[13px] transition-all cursor-pointer border select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330]",
                      isSelected
                        ? "bg-[#FDF3EE] border-[#BF5330] text-[#BF5330] font-semibold shadow-2xs"
                        : "bg-[#FFFBF7] border-[#E8DFD4] text-[#1A1614] font-normal hover:border-[#BF5330]/50 hover:bg-[#FAF4ED] hover:text-[#BF5330]",
                      !variant.inStock &&
                        "opacity-40 cursor-not-allowed line-through hover:border-[#E8DFD4] hover:bg-[#FFFBF7] hover:text-[#1A1614]"
                    )}
                  >
                    {variant.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="min-h-[38px] mb-4.5 flex items-center">
              <span className="font-[family-name:var(--font-body)] text-xs text-[#635850]/70 italic">
                Standard pack
              </span>
            </div>
          )}
        </div>

        {/* 3. Primary Full-Width CTA Button */}
        <div className="mt-auto pt-1">
          <Link
            href={productHref}
            prefetch={false}
            className="w-full bg-[#BF5330] hover:bg-[#8F3E20] text-white h-[46px] sm:h-[48px] rounded-[10px] font-[family-name:var(--font-body)] text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330]"
            aria-label={`Choose options for ${name}`}
          >
            <span>Choose options</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
