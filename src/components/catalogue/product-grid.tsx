import { cn } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/lib/storefront/types";
import { ProductCard, ProductCardSkeleton } from "./product-card";

interface ProductGridProps {
  products: ProductCardType[];
  className?: string;
  priorityCount?: number; // how many cards should have priority image loading
}

export function ProductGrid({ products, className, priorityCount = 0 }: ProductGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-4 lg:gap-x-5 lg:gap-y-8",
        className
      )}
      aria-label="Products"
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            priority={index < priorityCount}
          />
        </li>
      ))}
    </ul>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-4 lg:gap-x-5 lg:gap-y-8",
        className
      )}
      aria-label="Loading products"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
