import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf,
  Clock,
  Sparkles,
} from "lucide-react";
import { fetchBestsellerProducts, fetchCategories, fetchProducts } from "@/lib/storefront/api";
import { CategoryBento, CategoryBentoSkeleton } from "@/components/catalogue/category-bento";
import { FeaturedProductsFilter } from "@/components/catalogue/featured-products-filter";
import { ProductGridSkeleton } from "@/components/catalogue/product-grid";

export const metadata: Metadata = {
  title: "SPN Foods — Traditional Indian Health Foods",
  description:
    "Traditional Indian health mixes, spice powders, podis, masalas and snacks. Packaged with care for modern households.",
  alternates: { canonical: "/" },
};

// Revalidate homepage data every 60 seconds
export const revalidate = 60;

async function BestsellersSection() {
  const { featured, all } = await fetchBestsellerProducts();

  if (featured.length === 0 && all.length === 0) return null;

  return <FeaturedProductsFilter featuredProducts={featured} allProducts={all} />;
}

async function CategoriesSection() {
  const { categories } = await fetchCategories();
  return <CategoryBento categories={categories} />;
}

export default async function HomePage() {
  const [{ categories }, { total: totalProducts }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 1 }),
  ]);

  return (
    <div className="flex flex-col bg-[#FFFBF7]">
      {/* ── Viewport-filling Hero & Benefits Strip Wrapper ───────────────────── */}
      <div className="hero-viewport-frame bg-[#FFFBF7] relative">
        {/* ── Section 1: Editorial Hero ───────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-[#FFFBF7] flex-1 flex flex-col justify-center pt-0 pb-0"
        >
          {/* Botanical leaf accent at top-left matching reference */}
          <div className="absolute -top-3 sm:-top-4 lg:-top-5 left-0 w-28 sm:w-40 lg:w-48 pointer-events-none select-none z-10">
            <Image
              src="/hero-leaves.png"
              alt=""
              width={200}
              height={175}
              className="w-full h-auto object-contain opacity-95"
              priority
            />
          </div>

          {/* Left Narrative Content Container */}
          <div className="container-spn relative z-20 w-full py-2 sm:py-3 lg:py-4">
            <div className="max-w-[560px] lg:max-w-[490px] xl:max-w-[540px] text-center lg:text-left mx-auto lg:mx-0 lg:pl-2 xl:pl-6">
              {/* Eyebrow */}
              <span className="font-[family-name:var(--font-body)] text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#BF5330] mb-2 sm:mb-2.5 block">
                TRADITIONAL SOUTH INDIAN FOODS
              </span>

              {/* Editorial Headline: Strictly 2-line natural wrap on desktop */}
              <h1
                id="hero-heading"
                className="font-heading font-normal text-[34px] xs:text-[36px] sm:text-[44px] lg:text-[46px] xl:text-[48px] leading-[1.06] tracking-[-0.03em] text-[#1A1614] mb-3 sm:mb-3.5 whitespace-normal"
              >
                The honest taste of a{" "}
                <span className="text-[#BF5330]">
                  homestyle
                </span>{" "}
                kitchen
              </h1>

              {/* Tamil Heritage Tagline */}
              <p
                lang="ta"
                className="font-tamil text-[16px] xs:text-[17px] sm:text-[18px] lg:text-[19px] text-[#8F3E20] font-semibold tracking-wide mb-3 sm:mb-3.5 leading-snug"
              >
                அன்பும் அக்கறையும் நிறைந்த ஆரோக்கியம்
              </p>

              {/* Supporting Description: compact 2-line block */}
              <p className="font-[family-name:var(--font-body)] text-[15px] sm:text-[16px] lg:text-[16.5px] text-[#635850] leading-[1.55] mb-5 sm:mb-6 max-w-[460px] mx-auto lg:mx-0 font-normal">
                Traditional South Indian health mixes, podis, masalas and snacks for everyday meals.
              </p>

              {/* CTA Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-5">
                <Link
                  href="/shop"
                  className="group inline-flex justify-center items-center gap-2 font-[family-name:var(--font-body)] font-medium text-[15px] text-white bg-[#BF5330] hover:bg-[#8F3E20] h-[50px] px-7 rounded-[10px] shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330] w-full sm:w-auto"
                >
                  <span>Shop All Products</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/about"
                  prefetch={false}
                  className="group inline-flex justify-center items-center gap-1.5 font-[family-name:var(--font-body)] font-medium text-[15px] text-[#BF5330] hover:text-[#8F3E20] h-[50px] px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330] w-full sm:w-auto"
                >
                  <span className="underline decoration-[#BF5330]/35 underline-offset-4 group-hover:decoration-[#8F3E20]">
                    Explore Our Story
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>

              {/* Mobile Image: In-flow under CTAs on small screens */}
              <div className="lg:hidden relative w-full max-w-[480px] mx-auto aspect-[1218/764] select-none mt-5">
                <Image
                  src="/hero-visual.png"
                  alt="SPN Foods Black Rice Porridge Mix and Multi Grain Health Mix authentic traditional packaging"
                  fill
                  priority
                  sizes="(max-width: 512px) calc(100vw - 32px), 480px"
                  className="object-contain object-bottom pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Desktop Image: Flush to right edge, spanning full height from top to bottom */}
          <div className="hidden lg:flex absolute right-0 bottom-0 top-0 justify-end pointer-events-none z-10 select-none w-[58vw] xl:w-[60vw] max-w-[1120px]">
            <div className="relative h-full aspect-[1218/764] max-w-full">
              <Image
                src="/hero-visual.png"
                alt="SPN Foods Black Rice Porridge Mix and Multi Grain Health Mix authentic traditional packaging"
                fill
                priority
                sizes="(min-width: 1867px) 1120px, (min-width: 1280px) 60vw, 58vw"
                className="object-cover object-right pointer-events-none"
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Benefits Strip (Visible cleanly at the bottom edge of the screen) ──── */}
        <section
          aria-label="Brand highlights"
          className="w-full bg-[#F7EFE6] border-y border-[var(--color-border)] py-3 sm:py-3.5 z-20 shrink-0"
        >
          <div className="container-spn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-center">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                <Leaf className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" aria-hidden="true" />
                <span className="font-[family-name:var(--font-body)] text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] tracking-tight">
                  Heirloom Grain Blends
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                <Clock className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" aria-hidden="true" />
                <span className="font-[family-name:var(--font-body)] text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] tracking-tight">
                  Slow-Roasted in Small Batches
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" aria-hidden="true" />
                <span className="font-[family-name:var(--font-body)] text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] tracking-tight">
                  Zero Artificial Preservatives
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                <Truck className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" aria-hidden="true" />
                <span className="font-[family-name:var(--font-body)] text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] tracking-tight">
                  Direct Pan-India Delivery
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Section 3: Shop by Traditional Category ────────────────────────── */}
      <div id="categories" className="py-12 sm:py-16 lg:py-20 bg-[var(--color-surface)]">
        <Suspense fallback={<CategoryBentoSkeleton />}>
          <CategoriesSection />
        </Suspense>
      </div>

      {/* ── Section 4: Featured Bestsellers ────────────────────────────────── */}
      <div id="featured" className="py-12 sm:py-16 lg:py-20 bg-[#FFFBF7]">
        <Suspense
          fallback={
            <div className="container-spn">
              <div className="skeleton h-4 w-32 rounded mb-2" />
              <div className="skeleton h-8 w-64 rounded mb-8" />
              <ProductGridSkeleton count={8} />
            </div>
          }
        >
          <BestsellersSection />
        </Suspense>
      </div>

      {/* ── Section 5: Heritage Story Section (Warm Editorial Layout matching ref.png) ──────── */}
      <section
        aria-labelledby="heritage-heading"
        className="w-full bg-[#FFFBF7] py-10 sm:py-14 lg:py-16 overflow-hidden relative"
      >
        <div className="container-spn">
          <div className="relative rounded-[22px] sm:rounded-[26px] overflow-hidden border border-[#E8DFD4] bg-[#FAF4ED] shadow-[0_4px_24px_rgba(0,0,0,0.03)] w-full">
            <div className="flex flex-col lg:flex-row items-stretch w-full min-h-[380px] sm:min-h-[420px] lg:min-h-[440px] xl:min-h-[460px]">
              {/* Left Column: Authentic Food Photography (50% on desktop, full height) */}
              <div className="w-full lg:w-1/2 relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 self-stretch overflow-hidden">
                <Image
                  src="/categories/health-mix.jpg"
                  alt="SPN Foods traditional porridge and wholesome heirloom ingredients in authentic brass bowl"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-[center_60%] w-full h-full"
                />
                {/* Subtle right-edge soft blend into warm background on desktop */}
                <div
                  className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#FAF4ED] pointer-events-none"
                  aria-hidden="true"
                />
              </div>

              {/* Right Column: Editorial Narrative & Botanical Art (50% on desktop) */}
              <div className="w-full lg:w-1/2 relative flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-10 lg:py-12 xl:px-14 xl:py-14 z-10">
                {/* Subtle botanical line art decoration on far right */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-32 sm:w-44 lg:w-52 pointer-events-none select-none text-[#C5B4A2]/30 lg:text-[#C5B4A2]/35 flex items-center justify-end overflow-hidden"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 180 360"
                    fill="none"
                    stroke="currentColor"
                    className="w-full h-full object-contain object-right"
                    aria-hidden="true"
                  >
                    <path
                      d="M 160 10 Q 140 100 120 180 T 90 350"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    {/* Leaflet pair 1 */}
                    <path d="M 152 40 C 130 35 115 45 110 50 C 120 58 135 55 150 46" strokeWidth="1.1" />
                    <path d="M 150 44 L 115 48" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 155 35 C 165 20 180 15 185 20 C 180 30 170 35 157 37" strokeWidth="1.1" />
                    <path d="M 157 36 L 180 20" strokeWidth="0.8" opacity="0.7" />
                    {/* Leaflet pair 2 */}
                    <path d="M 143 80 C 115 70 95 80 85 90 C 100 100 125 95 140 85" strokeWidth="1.2" />
                    <path d="M 141 82 L 92 87" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 145 75 C 160 55 178 50 188 58 C 180 72 165 78 147 78" strokeWidth="1.2" />
                    <path d="M 146 76 L 182 56" strokeWidth="0.8" opacity="0.7" />
                    {/* Leaflet pair 3 */}
                    <path d="M 134 130 C 95 115 70 130 60 145 C 80 158 110 150 130 135" strokeWidth="1.3" />
                    <path d="M 132 132 L 68 141" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 136 120 C 155 95 180 90 190 102 C 180 120 160 128 138 125" strokeWidth="1.3" />
                    <path d="M 137 122 L 184 98" strokeWidth="0.8" opacity="0.7" />
                    {/* Leaflet pair 4 */}
                    <path d="M 124 185 C 80 170 50 188 40 205 C 62 220 98 210 120 192" strokeWidth="1.3" />
                    <path d="M 122 187 L 48 200" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 126 172 C 150 145 178 140 188 155 C 178 175 155 182 128 178" strokeWidth="1.3" />
                    <path d="M 127 174 L 182 150" strokeWidth="0.8" opacity="0.7" />
                    {/* Leaflet pair 5 */}
                    <path d="M 112 245 C 70 230 40 250 30 270 C 55 285 92 272 108 252" strokeWidth="1.3" />
                    <path d="M 110 247 L 38 265" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 114 230 C 140 200 170 198 180 215 C 168 238 142 242 116 235" strokeWidth="1.3" />
                    <path d="M 115 232 L 174 210" strokeWidth="0.8" opacity="0.7" />
                    {/* Leaflet pair 6 */}
                    <path d="M 100 305 C 65 292 38 312 30 330 C 52 344 85 330 96 312" strokeWidth="1.2" />
                    <path d="M 98 307 L 38 325" strokeWidth="0.8" opacity="0.7" />
                    <path d="M 102 290 C 128 262 158 260 166 278 C 152 298 128 300 104 294" strokeWidth="1.2" />
                    <path d="M 103 292 L 160 272" strokeWidth="0.8" opacity="0.7" />
                  </svg>
                </div>

                {/* Content Box with z-10 and balanced max-width */}
                <div className="relative z-10 w-full max-w-xl">
                  {/* Eyebrow */}
                  <span className="font-[family-name:var(--font-body)] text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#BF5330] mb-2 sm:mb-2.5 block">
                    Our Roots in Dharmapuri, Tamil Nadu
                  </span>

                  {/* Heading */}
                  <h2
                    id="heritage-heading"
                    className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] text-[#1A1614] leading-[1.16] tracking-[-0.015em] mb-3.5 sm:mb-4 font-normal"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Nourishment Rooted in Authentic Indian Tradition
                  </h2>

                  {/* Supporting paragraph */}
                  <p className="font-[family-name:var(--font-body)] text-[14px] sm:text-[14.5px] lg:text-[15px] text-[#635850] leading-[1.65] mb-6 sm:mb-7">
                    SPN Foods was founded on a simple principle: the recipes and nourishment passed down through traditional South Indian households represent one of the most balanced, enduring ways to feed a family.
                  </p>

                  {/* CTA Action */}
                  <div>
                    <Link
                      href="/about"
                      prefetch={false}
                      className="group inline-flex justify-center items-center gap-2 font-[family-name:var(--font-body)] font-medium text-[14px] text-white bg-[#BF5330] hover:bg-[#8F3E20] px-7 py-3 sm:py-3.5 rounded-full shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330]"
                    >
                      <span>Our Heritage Story</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Quality Commitment Section (Compact Horizontal Layout matching Image 1) ──── */}
      <section
        aria-labelledby="trust-heading"
        className="w-full bg-[#FFFBF7] border-t border-[#E8DFD4] py-7 sm:py-8 lg:py-9"
      >
        <div className="container-spn">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Header info (~43-44% width on desktop) */}
            <div className="w-full lg:w-[44%] xl:w-[43%] lg:border-r lg:border-[#E8DFD4] lg:pr-8 xl:pr-10 shrink-0">
              <span className="font-[family-name:var(--font-body)] text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#BF5330] mb-1.5 block">
                STANDARDS &amp; INTEGRITY
              </span>
              <h2
                id="trust-heading"
                className="text-xl sm:text-2xl lg:text-[27px] xl:text-[29px] text-[#1A1614] leading-[1.2] font-normal mb-1.5 whitespace-normal lg:whitespace-nowrap xl:whitespace-nowrap"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The SPN Foods Quality Commitment
              </h2>
              <p className="font-[family-name:var(--font-body)] text-[13px] sm:text-[13.5px] text-[#635850] leading-normal">
                Clear, verified food preparation principles upheld across every recipe and batch.
              </p>
            </div>

            {/* 4 Pillars with Vertical Dividers (~56-57% width on desktop) */}
            <div className="w-full lg:w-[56%] xl:w-[57%] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E8DFD4] items-center">
              <div className="flex flex-col items-center text-center p-2.5 sm:px-3 sm:py-1">
                <ShieldCheck className="w-5.5 h-5.5 text-[#BF5330] mb-2" aria-hidden="true" />
                <span className="font-semibold text-[12px] sm:text-[12.5px] text-[#1A1614] leading-[1.3] font-[family-name:var(--font-body)]">
                  Food Safety<br />Standards
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-2.5 sm:px-3 sm:py-1">
                <Leaf className="w-5.5 h-5.5 text-[#BF5330] mb-2" aria-hidden="true" />
                <span className="font-semibold text-[12px] sm:text-[12.5px] text-[#1A1614] leading-[1.3] font-[family-name:var(--font-body)]">
                  100% Traditional<br />Recipes
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-2.5 sm:px-3 sm:py-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5.5 h-5.5 text-[#BF5330] mb-2"
                  aria-hidden="true"
                >
                  <path d="M4 11h16a7.5 7.5 0 0 1-15 0z" />
                  <path d="M8.5 18.5h7" />
                  <path d="M15.5 3.5l-4.5 7.5" />
                </svg>
                <span className="font-semibold text-[12px] sm:text-[12.5px] text-[#1A1614] leading-[1.3] font-[family-name:var(--font-body)]">
                  Small-Batch<br />Milling
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-2.5 sm:px-3 sm:py-1">
                <Truck className="w-5.5 h-5.5 text-[#BF5330] mb-2" aria-hidden="true" />
                <span className="font-semibold text-[12px] sm:text-[12.5px] text-[#1A1614] leading-[1.3] font-[family-name:var(--font-body)]">
                  Pan-India<br />Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: Final Shopping Action (Compact Terracotta Banner matching Image 1) ─────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="w-full bg-[#FFFBF7] pb-10 sm:pb-12 pt-0 sm:pt-1"
      >
        <div className="container-spn">
          <div className="relative rounded-[16px] sm:rounded-[20px] bg-gradient-to-r from-[#BF5330] via-[#BA4E2C] to-[#993E20] text-white overflow-hidden shadow-xs">
            {/* Background delicate leaf watermark behind right composition */}
            <div
              className="absolute right-[36%] lg:right-[40%] top-1/2 -translate-y-1/2 w-48 h-48 opacity-15 pointer-events-none select-none text-white hidden md:block"
              aria-hidden="true"
            >
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 80 10 Q 50 50 30 90" />
                <path d="M 65 30 C 45 25 35 35 30 40 C 40 48 55 45 65 30" />
                <path d="M 50 50 C 30 45 20 55 15 60 C 25 68 40 65 50 50" />
                <path d="M 70 25 C 85 15 95 20 98 25 C 92 35 80 32 70 25" />
                <path d="M 55 45 C 70 35 80 40 85 45 C 78 55 65 52 55 45" />
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center relative z-10 min-h-[145px] sm:min-h-[155px] lg:min-h-[165px]">
              {/* Left Narrative Block */}
              <div className="sm:col-span-7 lg:col-span-7 xl:col-span-7 p-6 sm:p-7 lg:py-7 lg:pl-10 xl:pl-12 flex flex-col justify-center">
                <span className="font-[family-name:var(--font-body)] text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F7D8CC] mb-1.5 block">
                  TASTE THE TRADITION
                </span>
                <h2
                  id="cta-heading"
                  className="text-[20px] sm:text-[23px] lg:text-[26px] xl:text-[28px] text-white font-normal leading-[1.2] mb-3.5 max-w-xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Ready to bring authentic flavours to your table?
                </h2>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <Link
                    href="/shop"
                    className="group inline-flex justify-center items-center gap-1.5 font-[family-name:var(--font-body)] font-semibold text-[13px] text-[#BF5330] bg-white hover:bg-[#FFFBF7] h-[38px] sm:h-[40px] px-5 sm:px-6 rounded-full shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                  >
                    <span>Shop All Products</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/contact"
                    prefetch={false}
                    className="inline-flex justify-center items-center font-[family-name:var(--font-body)] font-medium text-[13px] sm:text-[13.5px] text-white/95 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>

              {/* Right Food Composition (Bleeds to right, top, bottom edges) */}
              <div className="hidden sm:block sm:col-span-5 lg:col-span-5 xl:col-span-5 absolute right-0 top-0 bottom-0 w-[42%] lg:w-[45%] xl:w-[48%] overflow-hidden pointer-events-none select-none">
                <Image
                  src="/categories/health-mix.jpg"
                  alt="Authentic traditional ingredients"
                  fill
                  sizes="(max-width: 1024px) 45vw, 560px"
                  className="object-cover object-[center_65%]"
                />
                {/* Subtle gradient feathering from terracotta banner */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#BF5330] via-[#BF5330]/30 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
