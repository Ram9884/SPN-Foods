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

export function CategoryChips({ categories, activeSlug, totalCount, className }: CategoryChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Build href for each chip — preserves other params (sort, etc.)
  function buildHref(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("offset"); // reset pagination

    if (!slug) {
      // "All" — go to /shop
      return "/shop?" + params.toString();
    }
    // Category — go to /shop/[slug]
    return `/shop/${slug}?${params.toString()}`;
  }

  const isAll = !activeSlug || (pathname === "/shop" && !activeSlug);

  const chipBase =
    "inline-flex items-center gap-1.5 h-9 px-3 font-[family-name:var(--font-body)] text-sm font-medium rounded-[4px] border transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)]";

  const chipActive =
    "bg-[var(--color-brand-primary-light)] border-[var(--color-brand-primary)] text-[var(--color-brand-primary-dark)] font-semibold";

  const chipInactive =
    "bg-transparent border-[var(--color-border)] text-[var(--color-text-body)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]";

  return (
    <div
      className={cn("flex gap-2 overflow-x-auto scrollbar-hide pb-1", className)}
      role="radiogroup"
      aria-label="Filter by category"
    >
      {/* All chip */}
      <Link
        href="/shop"
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
              href={`/shop/${cat.slug}`}
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
