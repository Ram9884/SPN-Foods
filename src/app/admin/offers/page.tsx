import type { Metadata } from "next";
import { OffersManager } from "@/components/admin/offers-manager";

export const metadata: Metadata = {
  title: "Offers & Promotions — SPN Foods Admin",
  description: "Manage product and category automatic promotional offers.",
};

export default function AdminOffersPage() {
  return <OffersManager />;
}
