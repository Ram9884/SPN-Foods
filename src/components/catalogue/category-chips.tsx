"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CategoryCard } from "@/lib/storefront/types";

interface CategoryChipsProps {
  categories: CategoryCard[];
  activeSlug?: string; // currently active category slug
  totalCount?: number;
  className?: string;
}

export function CategoryChips({ categories, activeSlug, className }: CategoryChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Build href for each chip — preserves other params (sort, etc.)
  function buildHref(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("offset"); // reset pagination on category switch

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    if (!slug) {
      return `/shop${queryStr}`;
    }
    return `/shop/${slug}${queryStr}`;
  }

  const isAll = !activeSlug || (pathname === "/shop" && !activeSlug);

  const chipBase =
    "inline-flex items-center justify-center h-9 sm:h-10 px-4.5 sm:px-5 rounded-full font-[family-name:var(--font-body)] text-[13px] sm:text-[13.5px] font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BF5330]";

  const chipActive =
    "bg-[#BF5330] border border-[#BF5330] text-white font-medium shadow-xs";

  const chipInactive =
    "bg-[#FFFBF7] border border-[#E8DFD4] text-[#1A1614] font-normal hover:border-[#BF5330] hover:text-[#BF5330]";

  return (
    <div
      className={cn("flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide py-1", className)}
      role="radiogroup"
      aria-label="Filter by category"
    >
      {/* All chip */}
      <Link
        href={buildHref()}
        className={cn(chipBase, isAll ? chipActive : chipInactive)}
        role="radio"
        aria-checked={isAll}
      >
        All
      </Link>

      {categories
        .filter((cat) => cat.slug !== "thokku")
        .map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={buildHref(cat.slug)}
              className={cn(chipBase, isActive ? chipActive : chipInactive)}
              role="radio"
              aria-checked={isActive}
            >
              {cat.name}
            </Link>
          );
        })}
    </div>
  );
}
