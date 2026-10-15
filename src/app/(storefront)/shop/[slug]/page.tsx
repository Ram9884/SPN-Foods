import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  fetchAllActiveCategories,
  fetchCategoryBySlug,
  fetchProducts,
} from "@/lib/storefront/api";
import { ProductGrid } from "@/components/catalogue/product-grid";
import { CategoryChips } from "@/components/catalogue/category-chips";
import { SortSelect } from "@/components/catalogue/sort-select";
import { Pagination } from "@/components/catalogue/pagination";
import { Breadcrumb } from "@/components/catalogue/breadcrumb";
import type { SortOption } from "@/lib/storefront/types";

export const revalidate = 60;

const PAGE_SIZE = 20;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    offset?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name} from SPN Foods. ${category.productCount} products available.`,
    alternates: { canonical: `/shop/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = (sp.sort as SortOption) ?? "featured";
  const offset = Math.max(0, Number(sp.offset ?? 0));

  const [category, { categories }, productsData] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchAllActiveCategories(),
    fetchProducts({ category: slug, sort, limit: PAGE_SIZE, offset }),
  ]);

  // 404 if category is not active or doesn't exist
  if (!category) notFound();

  const { products, total } = productsData;
  const totalAllCategories = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="py-8 lg:py-12">
      <div className="container-spn">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: category.name },
          ]}
          className="mb-4"
        />

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-product)] font-medium text-2xl lg:text-3xl text-[var(--color-text-primary)]">
            {category.name}
          </h1>
          {category.description && (
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-text-body)] mt-2 max-w-xl leading-relaxed">
              {category.description}
            </p>
          )}
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)] mt-1.5">
            {total} product{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Category filter chips */}
        <Suspense>
          <CategoryChips
            categories={categories}
            activeSlug={slug}
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
              No products in {category.name} right now
            </h2>
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-text-body)] mb-8 max-w-sm leading-relaxed">
              Have a look at everything else in the shop.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center h-11 px-6 font-[family-name:var(--font-body)] font-semibold text-base text-white bg-[var(--color-brand-primary)] rounded-[8px] hover:bg-[var(--color-brand-primary-dark)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
              >
                All Products
              </Link>
              {categories
                .filter((c) => c.slug !== slug)
                .slice(0, 3)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop/${c.slug}`}
                    className="inline-flex items-center h-11 px-5 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[8px] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
