import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Panel — SPN Foods",
  description: "Operational management for SPN Foods products, stock, categories, and customer orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await verifyAdminSession();

  if (!authResult.authorized) {
    if (authResult.reason === "UNAUTHENTICATED") {
      redirect("/sign-in?redirect_url=/admin");
    }

    // Authenticated non-admin: reject server-side
    return (
      <div className="min-h-screen bg-[var(--color-surface-cream)] flex items-center justify-center p-6 font-[family-name:var(--font-body)]">
        <div className="max-w-md w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-8 shadow-xs text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Access Restricted
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Admin access required. Your account is not authorized to access internal administrative controls.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-secondary)] transition-colors shadow-xs"
            >
              Return to Storefront
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-cream)] text-[var(--color-text-primary)] font-[family-name:var(--font-body)] lg:flex">
      {/* Sidebar Navigation */}
      <AdminNav profile={authResult.profile} />

      {/* Main Administrative Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
