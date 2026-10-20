import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout — SPN Foods",
  description: "Complete your SPN Foods order securely.",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?redirect_url=/checkout");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--color-brand-primary)]">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/cart" className="hover:text-[var(--color-brand-primary)]">
              Cart
            </Link>
          </li>
          <li>/</li>
          <li className="text-[var(--color-text-primary)] font-medium">Checkout</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)]">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Enter your delivery details and proceed to secure payment.
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
