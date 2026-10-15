import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { fetchCategories, fetchProducts } from "@/lib/storefront/api";
import { ProductGrid } from "@/components/catalogue/product-grid";
import { CategoryChips } from "@/components/catalogue/category-chips";
import { SortSelect } from "@/components/catalogue/sort-select";
import { Pagination } from "@/components/catalogue/pagination";
import { Breadcrumb } from "@/components/catalogue/breadcrumb";
import type { SortOption } from "@/lib/storefront/types";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse all SPN Foods products — health mixes, masalas, podis, snacks and more.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 60;

const PAGE_SIZE = 24;

interface ShopPageProps {
  searchParams: Promise<{
    sort?: string;
    offset?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const sort = (params.sort as SortOption) ?? "featured";
  const offset = Math.max(0, Number(params.offset ?? 0));

  const [{ categories }, productsData] = await Promise.all([
    fetchCategories(),
    fetchProducts({ sort, limit: PAGE_SIZE, offset }),
  ]);

  const { products, total } = productsData;

  const totalAllCategories = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="py-8 lg:py-12">
      <div className="container-spn">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop" },
          ]}
          className="mb-4"
        />

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl lg:text-3xl text-[var(--color-text-primary)]">
            All Products
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)] mt-1">
            {total} product{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Category filter chips */}
        <Suspense>
          <CategoryChips
            categories={categories}
            totalCount={totalAllCategories}
            className="mb-5"
          />
        </Suspense>

        {/* Sort bar */}
        <div
          id="product-grid-top"
          className="sticky top-14 lg:top-16 z-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] -mx-4 px-4 md:-mx-6 md:px-6 xl:-mx-10 xl:px-10 h-12 flex items-center justify-end mb-8"
        >
          <Suspense>
            <SortSelect currentSort={sort} />
          </Suspense>
        </div>

        {/* Product grid */}
        {products.length > 0 ? (
          <>
            <ProductGrid products={products} priorityCount={4} />
            <Suspense>
              <Pagination total={total} limit={PAGE_SIZE} offset={offset} />
            </Suspense>
          </>
        ) : (
          <div className="py-20">
            <p className="font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Catalogue</p>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)] mb-3">
              No products available right now
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-text-body)] mb-8 max-w-sm leading-relaxed">
              Browse a category or check back later.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Health Mix Powders", href: "/shop/health-mix-powders" },
                { label: "Masalas & Powders", href: "/shop/masalas-and-powders" },
                { label: "Podi Varieties", href: "/shop/podi-varieties" },
                { label: "Snacks", href: "/shop/snacks" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center h-9 px-4 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[8px] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
