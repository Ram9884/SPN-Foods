"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, MapPin, Star, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
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

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkSignOutAction({
  className,
  onFinish,
}: {
  className: string;
  onFinish: () => void;
}) {
  const clerk = useClerk();

  const handleSignOut = async () => {
    try {
      if (clerk && clerk.signOut) {
        await clerk.signOut();
      }
    } catch (err) {
      console.warn("Sign out encountered issue:", err);
    } finally {
      onFinish();
    }
  };

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Sign Out</span>
    </button>
  );
}

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleFallbackSignOut = () => {
    router.push("/");
    router.refresh();
  };

  const signOutBtnClass =
    "flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-raised)]/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] text-left";

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

      {HAS_CLERK ? (
        <ClerkSignOutAction
          className={signOutBtnClass}
          onFinish={handleFallbackSignOut}
        />
      ) : (
        <button
          type="button"
          onClick={handleFallbackSignOut}
          className={signOutBtnClass}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      )}
    </nav>
  );
}
