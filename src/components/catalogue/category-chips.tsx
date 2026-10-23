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

  const filteredCategories = categories.filter((cat) => cat.slug !== "thokku");

  const allItems = [
    { slug: undefined, name: "All", isActive: isAll },
    ...filteredCategories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      isActive: activeSlug === cat.slug,
    })),
  ];

  const firstThree = allItems.slice(0, 3);
  const remaining = allItems.slice(3);

  const renderChip = (
    item: { slug?: string; name: string; isActive: boolean },
    isMobile: boolean
  ) => (
    <Link
      key={item.slug ?? "all"}
      href={buildHref(item.slug)}
      className={cn(
        chipBase,
        isMobile
          ? "h-8 px-2.5 sm:px-3 text-[12px] sm:text-[12.5px]"
          : "h-9 sm:h-10 px-4.5 sm:px-5 text-[13px] sm:text-[13.5px]",
        item.isActive ? chipActive : chipInactive
      )}
      role="radio"
      aria-checked={item.isActive}
    >
      {item.name}
    </Link>
  );

  return (
    <div className={cn("w-full md:w-auto", className)}>
      {/* Mobile View (< md): Exactly 2 lines — first three on 1st line, other three/remaining on 2nd line */}
      <div
        className="flex md:hidden flex-col gap-2 w-full py-0.5"
        role="radiogroup"
        aria-label="Filter by category"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {firstThree.map((item) => renderChip(item, true))}
        </div>
        {remaining.length > 0 ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {remaining.map((item) => renderChip(item, true))}
          </div>
        ) : null}
      </div>

      {/* Desktop View (>= md): Clean single-row selector with standard spacing */}
      <div
        className="hidden md:flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide py-1"
        role="radiogroup"
        aria-label="Filter by category"
      >
        {allItems.map((item) => renderChip(item, false))}
      </div>
    </div>
  );
}
