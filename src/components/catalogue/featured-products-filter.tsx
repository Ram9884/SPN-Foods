"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BestsellerProduct } from "@/lib/storefront/types";
import { FeaturedProductCard } from "./featured-product-card";

interface FeaturedProductsFilterProps {
  featuredProducts: BestsellerProduct[];
  allProducts?: BestsellerProduct[];
}

const CATEGORY_TABS = [
  { label: "All", slug: "all" },
  { label: "Health Mix Powders", slug: "health-mix-powders" },
  { label: "Podi Varieties", slug: "podi-varieties" },
  { label: "Masalas & Powders", slug: "masalas-and-powders" },
  { label: "Snacks", slug: "snacks" },
] as const;

export function FeaturedProductsFilter({
  featuredProducts,
  allProducts = [],
}: FeaturedProductsFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // "All" tab strictly displays the 8 featured products in the requested order (two rows of four on desktop)
  // Specific category tabs filter from all active products
  const pool = activeCategory === "all" ? featuredProducts : (allProducts.length > 0 ? allProducts : featuredProducts);
  const filteredProducts =
    activeCategory === "all"
      ? featuredProducts
      : pool.filter((p) => p.category?.slug === activeCategory);

  return (
    <section aria-labelledby="featured-heading" className="w-full">
      <div className="container-spn">
        {/* Section Header matching Reference Image 1 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="font-[family-name:var(--font-body)] text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] text-[#BF5330] mb-2 block">
              SMALL-BATCH STAPLES
            </span>
            <h2
              id="featured-heading"
              className="text-3xl sm:text-4xl lg:text-[44px] text-[#1A1614] leading-[1.12] font-normal"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Featured Bestsellers
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[14.5px] sm:text-[15.5px] text-[#635850] mt-2 max-w-xl leading-relaxed font-normal">
              Everyday favourites, made for the way we cook at home.
            </p>
          </div>

          <Link
            href="/shop"
            prefetch={false}
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[14px] sm:text-[14.5px] font-medium text-[#BF5330] hover:text-[#8F3E20] hover:underline underline-offset-4 shrink-0 transition-colors"
          >
            <span>View all products</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter bestsellers by category"
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 mb-7 sm:mb-9"
        >
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.slug;
            return (
              <button
                key={tab.slug}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(tab.slug)}
                className={[
                  "h-9 sm:h-10 px-4 sm:px-5 rounded-full text-[13px] sm:text-[13.5px] font-[family-name:var(--font-body)] transition-all shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330]",
                  isSelected
                    ? "bg-[#BF5330] border border-[#BF5330] text-white font-medium shadow-xs"
                    : "bg-[#FFFBF7] border border-[#E8DFD4] text-[#1A1614] font-normal hover:border-[#BF5330] hover:text-[#BF5330]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid: 4 equal-width columns on desktop forming 2 rows of 4 */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {filteredProducts.map((product, idx) => (
              <FeaturedProductCard
                key={product.id}
                product={product}
                priority={idx < 4}
              />
            ))}
          </div>
        ) : (
          <div className="py-14 text-center rounded-[20px] bg-white border border-[#E8DFD4]">
            <p className="font-[family-name:var(--font-body)] text-sm text-[#635850]">
              No products found in this category right now.
            </p>
            <button
              onClick={() => setActiveCategory("all")}
              className="mt-3 text-xs font-semibold text-[#BF5330] hover:underline cursor-pointer"
            >
              Show all products
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
