"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, MapPin, Star, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Profile",
    href: "/account",
    icon: User,
    exact: true,
  },
  {
    label: "My Orders",
    href: "/account/orders",
    icon: Package,
    exact: false,
  },
  {
    label: "Saved Addresses",
    href: "/account/addresses",
    icon: MapPin,
    exact: false,
  },
  {
    label: "My Reviews",
    href: "/account/reviews",
    icon: Star,
    exact: false,
  },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const signOutBtnClass =
    "flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-raised)]/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] text-left disabled:opacity-60 cursor-pointer";

  return (
    <nav
      aria-label="Account navigation"
      className="flex flex-col sm:flex-row lg:flex-col gap-1.5 p-1 rounded-[8px] bg-[var(--color-surface-sunken)]/60 border border-[var(--color-border)]"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] font-[family-name:var(--font-body)] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]",
              isActive
                ? "bg-[var(--color-surface-raised)] text-[var(--color-brand-primary)] font-semibold shadow-xs"
                : "text-[var(--color-text-body)] hover:bg-[var(--color-surface-raised)]/70 hover:text-[var(--color-text-primary)]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive
                  ? "text-[var(--color-brand-primary)]"
                  : "text-[var(--color-text-muted)]"
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="hidden lg:block border-t border-[var(--color-border)] my-1" />

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className={signOutBtnClass}
      >
        {isSigningOut ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
      </button>
    </nav>
  );
}
