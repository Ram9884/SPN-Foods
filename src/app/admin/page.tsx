import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — SPN Foods Admin",
  description: "Operational overview of orders, inventory, and fulfillment.",
};

export default function AdminDashboardPage() {
  return <DashboardView />;
}
