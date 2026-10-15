import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Placed — SPN Foods",
  description: "Your order has been received.",
};

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string;
    orderNumber?: string;
    pending?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId, orderNumber, pending } = await searchParams;
  const isPending = pending === "true";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center sm:p-12 shadow-[var(--shadow-xs)]">
        {/* Status Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-sunken)]">
          {isPending ? (
            <svg
              className="h-7 w-7 text-[var(--color-warning)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-7 w-7 text-[var(--color-success)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        {/* Heading */}
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)] sm:text-3xl">
          {isPending ? "Payment Pending Confirmation" : "Order Placed Successfully"}
        </h1>

        <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] leading-relaxed">
          {isPending
            ? "Your payment is currently being confirmed with the payment provider. We will update your order status as soon as confirmation is received."
            : "Thank you for your purchase. We have received your order and are preparing it for fulfillment."}
        </p>

        {/* Order Details */}
        {(orderNumber || orderId) && (
          <div className="mx-auto mt-6 max-w-sm rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left text-xs font-[family-name:var(--font-body)]">
            {orderNumber && (
              <div className="flex justify-between py-1 border-b border-[var(--color-border)]/60">
                <span className="text-[var(--color-text-muted)]">Order Number</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  #{orderNumber}
                </span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between py-1 pt-1.5">
                <span className="text-[var(--color-text-muted)]">Order Reference</span>
                <span className="font-mono text-[var(--color-text-muted)]">
                  {orderId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="w-full rounded-[8px] bg-[var(--color-brand-primary)] px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] sm:w-auto"
          >
            Continue Shopping
          </Link>
          <Link
            href="/cart"
            className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] sm:w-auto"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
