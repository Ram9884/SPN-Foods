"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/storefront/types";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="aspect-square rounded-[12px] bg-[var(--color-surface-sunken)] flex items-center justify-center"
        aria-label={`${productName} — no image available`}
      >
        <span
          className="font-heading text-6xl font-normal text-[var(--color-border-strong)] select-none"
          aria-hidden
        >
          {productName.charAt(0)}
        </span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div
      role="region"
      aria-label="Product images"
    >
      {/* Primary image */}
      <div className="relative aspect-square rounded-[12px] overflow-hidden bg-[var(--color-surface-sunken)] mb-3">
        <Image
          key={activeImage.url}
          src={activeImage.url}
          alt={activeImage.alt ?? productName}
          fill
          sizes="(max-width: 1024px) calc(100vw - 32px), 660px"
          className="object-cover"
          priority
          fetchPriority="high"
        />
      </div>

      {/* Thumbnail strip — only shown when >1 image */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="list"
          aria-label="Product image thumbnails"
        >
          {images.map((img, index) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative flex-shrink-0 h-[58px] w-[58px] sm:h-[72px] sm:w-[72px] rounded-[6px] sm:rounded-[8px] overflow-hidden bg-[var(--color-surface-sunken)] border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-primary)]",
                index === activeIndex
                  ? "border-[var(--color-brand-primary)]"
                  : "border-transparent hover:border-[var(--color-border-strong)]"
              )}
              role="listitem"
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${productName} image ${index + 1}`}
                fill
                sizes="72px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
