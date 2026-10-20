import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { AccountNav } from "@/components/account/account-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account — SPN Foods",
  description: "Manage your personal profile, view past orders, and manage saved delivery addresses.",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-[family-name:var(--font-body)]">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li
            aria-current="page"
            className="font-medium text-[var(--color-text-primary)]"
          >
            My Account
          </li>
        </ol>
      </nav>

      {/* Main Account Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation (lg:col-span-3) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-8">
          <div className="mb-4">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)] font-bold">
              My Account
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Welcome back, {user.name || user.email}
            </p>
          </div>
          <AccountNav />
        </aside>

        {/* Content Area (lg:col-span-9) */}
        <main className="lg:col-span-9 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
