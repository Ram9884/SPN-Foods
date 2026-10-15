import type { Metadata } from "next";
import { AccountAddresses } from "@/components/account/account-addresses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Addresses — SPN Foods",
  description: "Manage your delivery addresses and set your default destination.",
};

export default function AccountAddressesPage() {
  return (
    <div className="space-y-6">
      <AccountAddresses />
    </div>
  );
}
