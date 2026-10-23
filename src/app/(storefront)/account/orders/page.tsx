import type { Metadata } from "next";
import { OrdersList } from "@/components/account/orders-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders — SPN Health Mix",
  description: "View your past orders, status, and receipts.",
};

export default function AccountOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)]">
          My Orders
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Review your purchase history, fulfillment status, and order details.
        </p>
      </div>

      <OrdersList />
    </div>
  );
}
