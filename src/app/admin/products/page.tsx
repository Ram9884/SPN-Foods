import type { Metadata } from "next";
import { ProductsList } from "@/components/admin/products-list";

export const metadata: Metadata = {
  title: "Products Catalogue — SPN Foods Admin",
  description: "View and filter all SPN Foods products, stock levels, and variants.",
};

export default function AdminProductsPage() {
  return <ProductsList />;
}
