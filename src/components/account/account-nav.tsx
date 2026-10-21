"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, ShoppingBag, MapPin, Star, LogOut, Loader2 } from "lucide-react";
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
    icon: ShoppingBag,
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

  return (
    <nav
      aria-label="Account navigation"
      className="rounded-2xl border border-[#E8DFD4] bg-white p-2 sm:p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-1"
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
              "relative flex items-center gap-3.5 px-4 py-3 rounded-xl font-[family-name:var(--font-body)] text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330]",
              isActive
                ? "bg-[#FDF4ED] text-[#B4491F] font-semibold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-[#B4491F] before:rounded-r-full shadow-2xs"
                : "text-[#4A3B32] hover:bg-[#FAF6F1] hover:text-[#1A1614]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive
                  ? "text-[#B4491F]"
                  : "text-[#786B62]"
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="border-t border-[#E8DFD4]/70 my-1.5" />

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-[family-name:var(--font-body)] text-sm font-medium text-[#4A3B32] hover:text-[#B4491F] hover:bg-[#FAF6F1] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF5330] text-left disabled:opacity-60 cursor-pointer"
      >
        {isSigningOut ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#786B62]" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4 shrink-0 text-[#786B62]" aria-hidden="true" />
        )}
        <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
      </button>
    </nav>
  );
}
