import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Add Product — SPN Foods Admin",
  description: "Create a new product in the SPN Foods catalogue.",
};

export default function AdminNewProductPage() {
  return <ProductForm />;
}
