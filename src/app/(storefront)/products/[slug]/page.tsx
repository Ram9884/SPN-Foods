import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProduct, fetchProductRatingSummary } from "@/lib/storefront/api";
import { Breadcrumb } from "@/components/catalogue/breadcrumb";
import { PriceDisplay } from "@/components/catalogue/price-display";
import { ProductGrid } from "@/components/catalogue/product-grid";
import { ProductImageGallery } from "@/components/catalogue/product-image-gallery";
import { ProductPurchasePanel } from "@/components/catalogue/product-purchase-panel";
import { RatingStars } from "@/components/reviews/rating-stars";
import { ProductReviewsSection } from "@/components/reviews/product-reviews-section";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ variant?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProduct(slug);
    const firstImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

    return {
      title: product.name,
      description:
        product.shortDescription ??
        (product.description ? product.description.slice(0, 155) : undefined),
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        images: firstImage ? [{ url: firstImage.url, alt: firstImage.alt ?? product.name }] : [],
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const initialVariantId = sp?.variant;

  let product;
  try {
    product = await fetchProduct(slug);
  } catch {
    notFound();
  }

  const ratingSummary = await fetchProductRatingSummary(product.id).catch(() => ({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  }));

  // Structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.shortDescription ?? undefined,
    brand: { "@type": "Brand", name: "SPN Foods" },
    image: product.images.map((i) => i.url),
    ...(ratingSummary.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.averageRating,
            reviewCount: ratingSummary.totalReviews,
          },
        }
      : {}),
    ...(product.variants.length > 0
      ? {
          offers: product.variants.map((v) => ({
            "@type": "Offer",
            price: (v.pricePaise / 100).toFixed(2),
            priceCurrency: "INR",
            availability: v.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            name: v.label,
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `/shop/${product.category.slug}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  };

  // Default to cheapest variant
  const defaultVariant = product.variants[0];

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="py-6 lg:py-10">
        <div className="container-spn">

          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: product.category.name, href: `/shop/${product.category.slug}` },
              { label: product.name },
            ]}
            className="mb-6"
          />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-start">

            {/* Left: Images */}
            <div className="lg:sticky lg:top-[88px]">
              <ProductImageGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Right: Purchase panel */}
            <div>
              {/* Category link */}
              <Link
                href={`/shop/${product.category.slug}`}
                className="font-[family-name:var(--font-body)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors uppercase tracking-wider"
              >
                {product.category.name}
              </Link>

              {/* Product name */}
              <h1 className="font-[family-name:var(--font-product)] text-2xl lg:text-[28px] font-medium text-[var(--color-text-primary)] mt-2 mb-2 leading-snug">
                {product.name}
              </h1>

              {/* Rating summary badge linking to reviews section */}
              <div className="flex items-center gap-2 mb-4">
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors group"
                >
                  <RatingStars rating={ratingSummary.averageRating} size="sm" />
                  <span className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                    {ratingSummary.totalReviews > 0 ? ratingSummary.averageRating.toFixed(1) : "New"}
                  </span>
                  <span>
                    ({ratingSummary.totalReviews} review{ratingSummary.totalReviews === 1 ? "" : "s"})
                  </span>
                </a>
              </div>

              {/* Short description */}
              {product.shortDescription && (
                <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-text-body)] leading-relaxed mb-5">
                  {product.shortDescription}
                </p>
              )}

              {/* Dynamic Purchase Panel (Live Pricing, Variant Radio Group, Quantity Stepper, Add to Cart) */}
              <ProductPurchasePanel product={product} initialVariantId={initialVariantId} />

              {product.variants.length > 0 && !product.inStock ? (
                <div className="mb-6">
                  <p className="w-full h-12 flex items-center justify-center font-[family-name:var(--font-body)] font-semibold text-base text-[var(--color-text-muted)] bg-[var(--color-surface-sunken)] rounded-[8px] border border-[var(--color-border)]">
                    Out of stock
                  </p>
                </div>
              ) : null}

              {/* ── Product information sections (Visibly below overview & purchase panel) ── */}
              {(Boolean(product.description?.trim()) ||
                Boolean(product.usage?.trim()) ||
                Boolean(product.ingredients?.trim())) && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border)] space-y-5">
                  <h2 className="font-[family-name:var(--font-heading)] text-lg lg:text-xl text-[var(--color-text-primary)] font-semibold">
                    Product Information
                  </h2>

                  {/* Product description */}
                  {product.description?.trim() && (
                    <div className="p-5 rounded-[10px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                      <h3 className="font-[family-name:var(--font-heading)] font-semibold text-sm lg:text-base text-[var(--color-text-primary)] mb-2">
                        Product Description
                      </h3>
                      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
                        {product.description.trim()}
                      </p>
                    </div>
                  )}

                  {/* How to use */}
                  {product.usage?.trim() && (
                    <div className="p-5 rounded-[10px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                      <h3 className="font-[family-name:var(--font-heading)] font-semibold text-sm lg:text-base text-[var(--color-text-primary)] mb-2">
                        How to Use
                      </h3>
                      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
                        {product.usage.trim()}
                      </p>
                    </div>
                  )}

                  {/* Ingredients (Only rendered when verified and non-empty) */}
                  {product.ingredients?.trim() && (
                    <div className="p-5 rounded-[10px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                      <h3 className="font-[family-name:var(--font-heading)] font-semibold text-sm lg:text-base text-[var(--color-text-primary)] mb-2">
                        Ingredients
                      </h3>
                      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
                        {product.ingredients.trim()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Customer Reviews & Ratings Section ─────────────────────────── */}
          <ProductReviewsSection
            productSlug={slug}
            initialSummary={ratingSummary}
          />

          {/* ── Related products ──────────────────────────────────────────── */}
          {product.related.length > 0 && (
            <div className="mt-12 lg:mt-16">
              <h2 className="font-[family-name:var(--font-heading)] text-xl lg:text-2xl text-[var(--color-text-primary)] mb-6">
                From the same category
              </h2>
              <ProductGrid products={product.related} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
