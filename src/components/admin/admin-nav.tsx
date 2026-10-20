"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Tag,
  ClipboardList,
  Percent,
  Ticket,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

type AdminProfile = {
  id: string;
  email: string;
  name: string | null;
  role: "admin";
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true, icon: LayoutGrid },
  { href: "/admin/products", label: "Products", exact: false, icon: Package },
  { href: "/admin/categories", label: "Categories", exact: false, icon: Tag },
  { href: "/admin/orders", label: "Orders", exact: false, icon: ClipboardList },
  { href: "/admin/offers", label: "Offers", exact: false, icon: Percent },
  { href: "/admin/coupons", label: "Coupons", exact: false, icon: Ticket },
  { href: "/admin/reviews", label: "Reviews", exact: false, icon: Star },
  { href: "/admin/settings", label: "Settings", exact: false, icon: Settings },
] as const;

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return "AD";
}

export function AdminNav({ profile }: { profile: AdminProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      router.push("/admin/login");
    } finally {
      setSigningOut(false);
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const initials = getInitials(profile.name, profile.email);
  const displayName = profile.name || "Sai Saran";

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#E8DFD4] bg-[#FFFBF7] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#1A1614] hover:bg-[#FAF5EF] focus:outline-none focus:ring-2 focus:ring-[#BF5330]"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="SPN Foods"
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-contain"
            />
            <span className="font-[family-name:var(--font-heading)] font-bold text-base text-[#1A1614]">
              SPN Foods
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#BF5330]/40 text-[#BF5330]">
              ADMIN
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#FFFBF7] border-r border-[#E8DFD4] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8DFD4] flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="SPN Foods Emblem"
              width={38}
              height={38}
              priority
              className="w-9 h-9 rounded-full object-contain drop-shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <div>
              <span className="block font-[family-name:var(--font-heading)] text-lg font-bold text-[#1A1614] leading-tight">
                SPN Foods
              </span>
              <span className="block text-[10px] font-semibold text-[#635850] tracking-wider uppercase mt-0.5">
                OPERATIONS PANEL
              </span>
            </div>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#BF5330]/50 text-[#BF5330]">
            ADMIN
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#BF5330] text-white shadow-xs font-semibold"
                    : "text-[#635850] hover:text-[#1A1614] hover:bg-[#FAF5EF]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-[#635850]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Identity & Sign Out */}
        <div className="p-4 border-t border-[#E8DFD4] bg-[#FFFBF7] space-y-3">
          {/* Admin Identity Card */}
          <div className="p-3 rounded-xl border border-[#E8DFD4] bg-[#FAF5EF]/90 flex items-center gap-3">
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#EFE7DD] border border-[#E8DFD4] flex items-center justify-center font-bold text-xs text-[#1A1614] shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#1A1614] truncate">
                  {displayName}
                </span>
                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>
              <p className="text-[10.5px] text-[#635850] font-medium leading-tight mt-0.5">
                Founder &amp; Admin
              </p>
              <p className="text-[10.5px] text-[#8C7E72] truncate leading-tight mt-0.5" title={profile.email}>
                {profile.email}
              </p>
            </div>
          </div>

          {/* Sign Out Action Button */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#BF5330] hover:text-[#8F3E20] transition-colors py-1 px-1 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
