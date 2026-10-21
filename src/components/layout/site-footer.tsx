import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MessageSquare, ShieldCheck } from "lucide-react";
import type { CategoryCard } from "@/lib/storefront/types";
import type { BusinessSettings } from "@/lib/settings/types";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9" />
    </svg>
  );
}

interface SiteFooterProps {
  categories: CategoryCard[];
  settings?: BusinessSettings | null;
}

export function SiteFooter({ categories, settings }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const brandName = settings?.businessName || "SPN Foods";
  const supportEmail = settings?.supportEmail || "spnhealthmix@gmail.com";

  return (
    <footer className="bg-[#FAF5EF] border-t border-[var(--color-border)] mt-auto text-[var(--color-text-secondary)]">
      {/* Main footer content */}
      <div className="container-spn py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">
          {/* Col 1: Brand & Contact Information */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-3.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-[family-name:var(--font-logo)] text-xl sm:text-[21px] lg:text-[22px] text-[var(--color-brand-primary)] tracking-tight font-normal leading-none group"
            >
              <Image
                src="/logo.png"
                alt="SPN Foods Emblem"
                width={36}
                height={36}
                className="w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-full object-contain drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
              />
              <span>{brandName}</span>
            </Link>

            <p className="text-[13.5px] text-[var(--color-text-secondary)] leading-relaxed max-w-sm font-[family-name:var(--font-body)]">
              {settings?.footerText?.trim() ||
                "Traditional Indian food crafted for modern households. Nutrient-dense health mixes, freshly roasted podis, and pure spices made with care."}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1 text-[var(--color-text-muted)]">
              {settings?.socialLinks?.instagram ? (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-brand-primary)] transition-colors p-1 -ml-1"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-brand-primary)] transition-colors p-1 -ml-1"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}

              {settings?.socialLinks?.youtube ? (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-brand-primary)] transition-colors p-1"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-brand-primary)] transition-colors p-1"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Verified Credentials if configured */}
            {(settings?.fssaiNumber || settings?.gstin) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 font-[family-name:var(--font-body)]">
                {settings?.fssaiNumber && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-white border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-secondary)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                    <span>FSSAI: {settings.fssaiNumber}</span>
                  </div>
                )}
                {settings?.gstin && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-white border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-secondary)]">
                    <span>GSTIN: {settings.gstin}</span>
                  </div>
                )}
              </div>
            )}

            {/* Direct Contact Details */}
            <div className="pt-1 text-xs text-[var(--color-text-muted)] space-y-1.5 font-[family-name:var(--font-body)]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0" />
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] hover:underline font-medium break-all sm:break-normal"
                >
                  {supportEmail}
                </a>
              </div>

              {settings?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0" />
                  <span className="text-[var(--color-text-primary)]">{settings.phone}</span>
                </div>
              )}

              {settings?.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0" />
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] hover:underline font-medium"
                  >
                    WhatsApp: {settings.whatsapp}
                  </a>
                </div>
              )}

              {settings?.address && (settings.address.line1 || settings.address.city) && (
                <p className="text-[var(--color-text-muted)] leading-normal pt-1">
                  {[
                    settings.address.line1,
                    settings.address.line2,
                    settings.address.city,
                    settings.address.state,
                    settings.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Col 2: Catalogue & Ranges */}
          <div className="sm:col-span-1 lg:col-span-3">
            <h3 className="font-[family-name:var(--font-body)] font-semibold text-[11px] text-[var(--color-brand-primary)] uppercase tracking-[0.14em] mb-4">
              Catalogue &amp; Ranges
            </h3>
            <ul className="space-y-2.5 font-[family-name:var(--font-body)]">
              <li>
                <Link
                  href="/shop"
                  prefetch={false}
                  className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/health-mix-powders"
                  prefetch={false}
                  className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  Health Mix Powders
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/podi-varieties"
                  prefetch={false}
                  className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  Podi Varieties
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/masalas-and-powders"
                  prefetch={false}
                  className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  Masalas &amp; Powders
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/snacks"
                  prefetch={false}
                  className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                >
                  Traditional Snacks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies & Assistance */}
          <div className="sm:col-span-1 lg:col-span-4">
            <h3 className="font-[family-name:var(--font-body)] font-semibold text-[11px] text-[var(--color-brand-primary)] uppercase tracking-[0.14em] mb-4">
              Policies &amp; Assistance
            </h3>
            <ul className="space-y-2.5 font-[family-name:var(--font-body)]">
              {[
                { label: "About Our Heritage", href: "/about" },
                { label: "Contact Customer Support", href: "/contact" },
                { label: "Shipping & Delivery Policy", href: "/shipping-policy" },
                {
                  label: "Cancellation & Refund Policy",
                  href: "/cancellation-refund-policy",
                },
                { label: "Privacy Policy", href: "/privacy-policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-border)] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[var(--color-text-muted)] font-[family-name:var(--font-body)] text-center sm:text-left">
          <p>
            &copy; {currentYear} {brandName}. All rights reserved. Handcrafted in Tamil Nadu.
          </p>
          <p className="font-medium text-[var(--color-text-secondary)]">
            Verified Payments by Razorpay
          </p>
        </div>
      </div>
    </footer>
  );
}
