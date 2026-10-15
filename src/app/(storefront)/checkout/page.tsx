import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout — SPN Foods",
  description: "Complete your SPN Foods order securely.",
};

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function CheckoutPage() {
  if (HAS_CLERK) {
    try {
      const { userId } = await auth();
      if (!userId) {
        redirect("/sign-in?redirect_url=/checkout");
      }
    } catch (err) {
      if ((err as any)?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.warn("Clerk auth check encountered error in checkout page:", err);
    }
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
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href="/cart" className="hover:text-[var(--color-brand-primary)]">
              Cart
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li
            aria-current="page"
            className="font-medium text-[var(--color-text-primary)]"
          >
            Checkout
          </li>
        </ol>
      </nav>

      <div className="mb-8 border-b border-[var(--color-border)] pb-6 font-[family-name:var(--font-body)]">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)] sm:text-3xl">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-body)]">
          Select your delivery address, review your items, and complete your payment.
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
