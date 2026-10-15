"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, Search, ShoppingBag, User, Package, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import type { CategoryCard } from "@/lib/storefront/types";

const NAV_CATEGORIES = [
  { name: "Health Mix Powders", slug: "health-mix-powders" },
  { name: "Podi Varieties", slug: "podi-varieties" },
  { name: "Masalas & Powders", slug: "masalas-and-powders" },
  { name: "Snacks", slug: "snacks" },
] as const;

const MORE_LINKS = [
  { label: "Contact Support", href: "/contact" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cancellation & Refund Policy", href: "/cancellation-refund-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
] as const;

interface SiteNavProps {
  categories: CategoryCard[];
}

export function SiteNav({ categories }: SiteNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const catButtonRef = useRef<HTMLButtonElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 80;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close drawer and dropdowns on route change (bail out if already closed)
  useEffect(() => {
    setDrawerOpen((prev) => (prev ? false : prev));
    setCatOpen((prev) => (prev ? false : prev));
    setMobileCatOpen((prev) => (prev ? false : prev));
    setMoreOpen((prev) => (prev ? false : prev));
    setMobileMoreOpen((prev) => (prev ? false : prev));
  }, [pathname]);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    if (!catOpen && !moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (catOpen) {
          setCatOpen(false);
          catButtonRef.current?.focus();
        }
        if (moreOpen) {
          setMoreOpen(false);
          moreButtonRef.current?.focus();
        }
      }
    };
    const onOutside = (e: MouseEvent) => {
      if (
        catOpen &&
        catButtonRef.current &&
        !catButtonRef.current.contains(e.target as Node) &&
        catMenuRef.current &&
        !catMenuRef.current.contains(e.target as Node)
      ) {
        setCatOpen(false);
      }

      if (
        moreOpen &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node) &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [catOpen, moreOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const { itemCount } = useCart();

  const isHomeActive = pathname === "/";
  const isShopActive = pathname === "/shop";
  const isCategoriesActive = pathname.startsWith("/shop/") || pathname.startsWith("/products");
  const isAboutActive = pathname === "/about";
  const isMoreActive = MORE_LINKS.some((l) => pathname === l.href);

  return (
    <>
      {/* ── Main Nav Bar ───────────────────────────────────────────────────── */}
      <header
        role="banner"
        className={cn(
          "sticky top-0 left-0 right-0 z-40 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] transition-shadow duration-150",
          scrolled && "shadow-[var(--shadow-xs)]"
        )}
      >
        <div className="container-spn h-[60px] lg:h-[64px] flex items-center justify-between gap-4">

          {/* Mobile: hamburger */}
          <button
            className="lg:hidden flex items-center justify-center h-10 w-10 -ml-1 rounded-[6px] hover:bg-[var(--color-surface-sunken)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Menu className="h-5 w-5 text-[var(--color-text-primary)]" aria-hidden />
          </button>

          {/* Logo */}
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] rounded group"
            aria-label="SPN Foods — Home"
          >
            <Image
              src="/logo.png"
              alt="SPN Foods Emblem"
              width={40}
              height={40}
              priority
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
            />
            <span
              className="font-[family-name:var(--font-heading)] text-2xl lg:text-[27px] text-[var(--color-brand-primary)] tracking-tight font-normal"
            >
              SPN Foods
            </span>
          </Link>

          {/* Desktop center nav */}
          <nav
            className="hidden lg:flex items-center gap-5 xl:gap-7"
            aria-label="Primary navigation"
          >
            <Link
              href="/"
              prefetch={false}
              className={cn(
                "font-[family-name:var(--font-body)] text-[14.5px] xl:text-[15px] font-medium transition-colors hover:text-[var(--color-brand-primary)] rounded-[4px] px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
                isHomeActive
                  ? "text-[var(--color-brand-primary)] font-semibold"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              Home
            </Link>

            <Link
              href="/shop"
              className={cn(
                "font-[family-name:var(--font-body)] text-[14.5px] xl:text-[15px] font-medium transition-colors hover:text-[var(--color-brand-primary)] rounded-[4px] px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
                isShopActive
                  ? "text-[var(--color-brand-primary)] font-semibold"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              Shop
            </Link>

            {/* Categories dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                ref={catButtonRef}
                className={cn(
                  "inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-[14.5px] xl:text-[15px] font-medium transition-colors hover:text-[var(--color-brand-primary)] py-2 px-1 rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
                  isCategoriesActive
                    ? "text-[var(--color-brand-primary)] font-semibold"
                    : "text-[var(--color-text-primary)]"
                )}
                aria-haspopup="menu"
                aria-expanded={catOpen}
                aria-controls="cat-dropdown"
                onClick={() => setCatOpen((o) => !o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCatOpen((o) => !o);
                  }
                }}
              >
                <span>Categories</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-150" aria-hidden />
              </button>

              {/* Horizontal dropdown menu */}
              <div
                id="cat-dropdown"
                ref={catMenuRef}
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-1.5 z-50 transition-all duration-150 origin-top pointer-events-auto",
                  catOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1 pointer-events-none"
                )}
                role="menu"
              >
                <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[12px] shadow-[var(--shadow-md)] p-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    {NAV_CATEGORIES.map((cat) => {
                      const isItemActive = pathname === `/shop/${cat.slug}`;
                      return (
                        <Link
                          key={cat.slug}
                          href={`/shop/${cat.slug}`}
                          prefetch={false}
                          className={cn(
                            "flex items-center px-3.5 py-2 rounded-[8px] text-sm font-[family-name:var(--font-body)] transition-all",
                            isItemActive
                              ? "bg-[var(--color-brand-primary)] text-white font-medium shadow-xs"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
                          )}
                          role="menuitem"
                          onClick={() => setCatOpen(false)}
                        >
                          <span className="whitespace-nowrap font-medium">{cat.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* About Us link */}
            <Link
              href="/about"
              className={cn(
                "font-[family-name:var(--font-body)] text-[14.5px] xl:text-[15px] font-medium transition-colors hover:text-[var(--color-brand-primary)] rounded-[4px] px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
                isAboutActive
                  ? "text-[var(--color-brand-primary)] font-semibold"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              About Us
            </Link>

            {/* More dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                ref={moreButtonRef}
                className={cn(
                  "inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-[14.5px] xl:text-[15px] font-medium transition-colors hover:text-[var(--color-brand-primary)] py-2 px-1 rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
                  isMoreActive
                    ? "text-[var(--color-brand-primary)] font-semibold"
                    : "text-[var(--color-text-primary)]"
                )}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-controls="more-dropdown"
                onClick={() => setMoreOpen((o) => !o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setMoreOpen((o) => !o);
                  }
                }}
              >
                <span>More</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-150" aria-hidden />
              </button>

              {/* Dropdown menu */}
              <div
                id="more-dropdown"
                ref={moreMenuRef}
                className={cn(
                  "absolute top-full left-0 mt-1 w-64 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-[var(--shadow-md)] transition-all duration-150 origin-top-left z-50",
                  moreOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1 pointer-events-none"
                )}
                role="menu"
              >
                <div className="py-2">
                  {MORE_LINKS.map((link) => {
                    const isItemActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm font-[family-name:var(--font-body)] transition-colors",
                          isItemActive
                            ? "bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] font-medium"
                            : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
                        )}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Right controls: Search pill, User, Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Inline search bar (Desktop) */}
            <form
              action="/shop"
              method="GET"
              className="relative hidden sm:flex items-center"
              role="search"
            >
              <Search
                className="absolute left-3.5 w-3.5 h-3.5 text-[var(--color-text-muted)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                placeholder="Search products..."
                aria-label="Search products"
                className="w-40 md:w-48 lg:w-56 h-9 pl-9 pr-3 text-[13px] rounded-full bg-[#FAF5EE] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:bg-white transition-all font-[family-name:var(--font-body)]"
              />
            </form>

            {/* Mobile search icon button */}
            <Link
              href="/search"
              prefetch={false}
              className="sm:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-[var(--color-surface-sunken)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
              aria-label="Search products"
            >
              <Search className="h-5 w-5 text-[var(--color-text-primary)]" aria-hidden />
            </Link>

            {/* Account Icon */}
            <Link
              href="/account"
              prefetch={false}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-[var(--color-surface-sunken)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
              aria-label="My Account"
            >
              <User className="h-5 w-5" aria-hidden />
            </Link>

            {/* Cart Icon with Terracotta Badge */}
            <Link
              href="/cart"
              prefetch={false}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-[var(--color-surface-sunken)] active:scale-95 transition-all relative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
              aria-label={itemCount > 0 ? `Shopping cart, ${itemCount} items` : "Shopping cart"}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white text-[10.5px] font-bold px-1 leading-none shadow-xs">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-[#1A1614]/40 transition-opacity duration-250 lg:hidden",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        aria-hidden={!drawerOpen}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-[80vw] max-w-[320px] bg-[var(--color-surface-raised)] shadow-[var(--shadow-lg)] transition-transform duration-250 ease-out lg:hidden flex flex-col",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] shrink-0">
          <Link
            href="/"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="SPN Foods Emblem"
              width={30}
              height={30}
              className="w-7 h-7 rounded-full object-contain"
            />
            <span
              className="font-[family-name:var(--font-logo)] text-xl text-[var(--color-brand-primary)] font-normal"
            >
              SPN Foods
            </span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-[4px] hover:bg-[var(--color-surface-sunken)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5 text-[var(--color-text-body)]" aria-hidden />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto py-3" aria-label="Mobile navigation">
          {/* Home */}
          <Link
            href="/"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex items-center px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
              isHomeActive
                ? "bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] font-semibold"
                : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
            )}
          >
            Home
          </Link>

          {/* Shop */}
          <Link
            href="/shop"
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex items-center px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
              isShopActive
                ? "bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] font-semibold"
                : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
            )}
          >
            Shop
          </Link>

          {/* Expandable Categories */}
          <div>
            <button
              type="button"
              onClick={() => setMobileCatOpen((o) => !o)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
                isCategoriesActive
                  ? "text-[var(--color-brand-primary)] font-semibold"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
              )}
              aria-expanded={mobileCatOpen}
              aria-controls="mobile-cat-sublist"
            >
              <span>Categories</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200",
                  mobileCatOpen && "rotate-180 text-[var(--color-brand-primary)]"
                )}
                aria-hidden
              />
            </button>

            {mobileCatOpen && (
              <div
                id="mobile-cat-sublist"
                className="bg-[var(--color-surface-sunken)]/60 py-1.5 border-y border-[var(--color-border)]/60"
              >
                {NAV_CATEGORIES.map((cat) => {
                  const isItemActive = pathname === `/shop/${cat.slug}`;
                  return (
                    <Link
                      key={cat.slug}
                      href={`/shop/${cat.slug}`}
                      prefetch={false}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center justify-between pl-8 pr-5 py-2.5 text-sm font-[family-name:var(--font-body)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
                        isItemActive
                          ? "text-[var(--color-brand-primary)] font-semibold"
                          : "text-[var(--color-text-body)] hover:text-[var(--color-brand-primary)]"
                      )}
                    >
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* About Us */}
          <Link
            href="/about"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex items-center px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
              isAboutActive
                ? "bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] font-semibold"
                : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
            )}
          >
            About Us
          </Link>

          {/* Expandable More */}
          <div>
            <button
              type="button"
              onClick={() => setMobileMoreOpen((o) => !o)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-primary)]",
                isMoreActive
                  ? "text-[var(--color-brand-primary)] font-semibold"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)]"
              )}
              aria-expanded={mobileMoreOpen}
              aria-controls="mobile-more-sublist"
            >
              <span>More</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200",
                  mobileMoreOpen && "rotate-180 text-[var(--color-brand-primary)]"
                )}
                aria-hidden
              />
            </button>

            {mobileMoreOpen && (
              <div
                id="mobile-more-sublist"
                className="bg-[var(--color-surface-sunken)]/60 py-1.5 border-y border-[var(--color-border)]/60"
              >
                {MORE_LINKS.map((link) => {
                  const isItemActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center justify-between pl-8 pr-5 py-2.5 text-sm font-[family-name:var(--font-body)] transition-colors",
                        isItemActive
                          ? "text-[var(--color-brand-primary)] font-semibold"
                          : "text-[var(--color-text-body)] hover:text-[var(--color-brand-primary)]"
                      )}
                    >
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="my-2 border-t border-[var(--color-border)]" />

          {/* Account, Orders, Cart */}
          <Link
            href="/account"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5 px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)] transition-colors"
          >
            <User className="h-4 w-4 text-[var(--color-text-body)]" aria-hidden />
            <span>My Account</span>
          </Link>

          <Link
            href="/account/orders"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5 px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)] transition-colors"
          >
            <Package className="h-4 w-4 text-[var(--color-text-body)]" aria-hidden />
            <span>My Orders</span>
          </Link>

          <Link
            href="/cart"
            prefetch={false}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-between px-5 py-3 text-base font-[family-name:var(--font-body)] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-brand-primary)] transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="h-4 w-4 text-[var(--color-text-body)]" aria-hidden />
              Cart
            </span>
            {itemCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand-primary)] text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </>
  );
}
