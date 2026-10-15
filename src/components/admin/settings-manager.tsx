"use client";

import { useEffect, useState } from "react";
import type { BusinessSettings } from "@/lib/settings/types";

export function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<BusinessSettings>({
    businessName: "SPN Foods",
    supportEmail: "spnhealthmix@gmail.com",
    phone: null,
    whatsapp: null,
    address: null,
    fssaiNumber: null,
    gstin: null,
    socialLinks: null,
    footerText: null,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/settings/business");
        if (!res.ok) {
          throw new Error("Failed to load business settings");
        }
        const data = await res.json();
        setFormData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to save settings");
      }

      const updated = await res.json();
      setFormData(updated);
      setSuccess("Business settings updated successfully and logged to audit trail.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C45935]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">Business Information &amp; Settings</h1>
        <p className="text-sm text-[#87786E] mt-1">
          Configure official company details, customer support contacts, and statutory registrations (FSSAI/GST).
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Security notice */}
      <div className="p-4 bg-[#FAF6F2] border border-[#EDE6DF] rounded-xl text-xs text-[#87786E] space-y-1">
        <p className="font-semibold text-[#2B231D]">🔒 Security &amp; Data Integrity Rules:</p>
        <p>• Sensitive API keys, database credentials, and SMTP App Passwords are never stored here. They remain exclusively in server environment secrets.</p>
        <p>• Statutory registrations (FSSAI / GSTIN) and phone numbers remain completely hidden from the public storefront until verified and filled in below. No fake placeholders will ever be shown to customers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Brand / Identity */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE6DF] shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2B231D] border-b border-[#F6EFE9] pb-3">Company Identity</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                Business / Brand Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                Customer Support Email *
              </label>
              <input
                type="email"
                required
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>
          </div>
        </div>

        {/* Support Channels */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE6DF] shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2B231D] border-b border-[#F6EFE9] pb-3">Support Contacts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                Support Phone Number
              </label>
              <input
                type="text"
                placeholder="Leave blank if unconfigured"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
              <p className="text-[11px] text-[#AFA298] mt-1">Displayed on Contact/About page only when populated.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                placeholder="Leave blank if unconfigured"
                value={formData.whatsapp || ""}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value || null })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
              <p className="text-[11px] text-[#AFA298] mt-1">Displayed on Contact/About page only when populated.</p>
            </div>
          </div>
        </div>

        {/* Statutory Registrations (FSSAI & GSTIN) */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE6DF] shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2B231D] border-b border-[#F6EFE9] pb-3">
            Statutory &amp; Regulatory Registrations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                FSSAI License / Registration No.
              </label>
              <input
                type="text"
                placeholder="Leave blank until officially registered"
                value={formData.fssaiNumber || ""}
                onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value || null })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
              <p className="text-[11px] text-[#AFA298] mt-1">
                Kept strictly hidden from the public storefront until populated with authentic number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                placeholder="Leave blank until officially registered"
                value={formData.gstin || ""}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value || null })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
              <p className="text-[11px] text-[#AFA298] mt-1">
                Kept strictly hidden from the public storefront until populated with authentic number.
              </p>
            </div>
          </div>
        </div>

        {/* Registered Business Address */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE6DF] shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2B231D] border-b border-[#F6EFE9] pb-3">Business Address</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">Address Line 1</label>
              <input
                type="text"
                placeholder="Address line 1 (e.g., Street or building name)"
                value={formData.address?.line1 || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, line1: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">Address Line 2</label>
              <input
                type="text"
                placeholder="Address line 2 (e.g., Suite, unit, or landmark)"
                value={formData.address?.line2 || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, line2: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.address?.city || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value || null },
                  })}
                  className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={formData.address?.state || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value || null },
                  })}
                  className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">PIN Code</label>
                <input
                  type="text"
                  placeholder="PIN Code"
                  value={formData.address?.pincode || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, pincode: e.target.value || null },
                  })}
                  className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE6DF] shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2B231D] border-b border-[#F6EFE9] pb-3">Social Media Links</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/..."
                value={formData.socialLinks?.instagram || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">Facebook URL</label>
              <input
                type="text"
                placeholder="https://facebook.com/..."
                value={formData.socialLinks?.facebook || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">YouTube URL</label>
              <input
                type="text"
                placeholder="https://youtube.com/..."
                value={formData.socialLinks?.youtube || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, youtube: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#87786E] uppercase mb-1">X (Twitter) URL</label>
              <input
                type="text"
                placeholder="https://x.com/..."
                value={formData.socialLinks?.twitter || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value || null },
                })}
                className="w-full px-3 py-2 border border-[#EDE6DF] rounded-md text-sm text-[#2B231D] focus:outline-none focus:border-[#C45935]"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C45935] hover:bg-[#824629] text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Business Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
