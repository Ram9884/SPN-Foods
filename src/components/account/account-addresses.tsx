"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Check, MapPin, AlertCircle, X } from "lucide-react";
import { INDIAN_STATES } from "@/lib/customers/validation";
import { useToast } from "@/components/ui/toast";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export function AccountAddresses() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/addresses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses ?? []);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName("");
    setPhone("");
    setLine1("");
    setLine2("");
    setLandmark("");
    setCity("");
    setState("Tamil Nadu");
    setPincode("");
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setLandmark(addr.landmark ?? "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fullName.trim().length < 2) {
      setFormError("Please enter full name (at least 2 characters).");
      return;
    }
    const cleanPhone = phone.replace(/[\s\-().]/g, "");
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setFormError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (line1.trim().length < 5) {
      setFormError("Please enter complete street address (at least 5 characters).");
      return;
    }
    if (city.trim().length < 2) {
      setFormError("Please enter a valid city name.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setFormError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        fullName: fullName.trim(),
        phone: cleanPhone,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state,
        pincode: pincode.trim(),
        isDefault,
      };

      const url = editingAddress
        ? `/api/me/addresses/${editingAddress.id}`
        : "/api/me/addresses";
      const method = editingAddress ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to save address.");
        showToast("Could not save address.", "error");
        return;
      }

      await fetchAddresses();
      setFormOpen(false);
      showToast(
        editingAddress ? "Address updated successfully." : "Address added successfully.",
        "success"
      );
    } catch (err) {
      console.error("Save address error:", err);
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addrId: string) => {
    try {
      const res = await fetch(`/api/me/addresses/${addrId}/default`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchAddresses();
        showToast("Default address updated.", "success");
      } else {
        showToast("Could not set as default address.", "error");
      }
    } catch (err) {
      console.error("Set default error:", err);
      showToast("Network error.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/me/addresses/${deletingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAddresses();
        showToast("Address deleted.", "success");
        setDeletingId(null);
      } else {
        const data = await res.json();
        showToast(data.message || "Could not delete address.", "error");
      }
    } catch (err) {
      console.error("Delete address error:", err);
      showToast("Network error while deleting address.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] animate-pulse"
          >
            <div className="h-4 w-40 bg-[var(--color-surface-sunken)] rounded mb-3" />
            <div className="h-3 w-64 bg-[var(--color-surface-sunken)] rounded mb-2" />
            <div className="h-3 w-32 bg-[var(--color-surface-sunken)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[family-name:var(--font-body)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-xl text-[var(--color-text-primary)]">
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Manage your delivery destinations for quick checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add New Address</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-center max-w-md mx-auto">
          <MapPin className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] mb-1">
            No saved addresses
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed">
            You have not saved any delivery addresses yet. Add one to enable fast checkout.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white text-xs font-semibold transition-colors"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-5 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xs)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {addr.fullName}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] border border-[var(--color-border)]">
                      <Check className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>

                <div className="text-xs text-[var(--color-text-body)] space-y-1 leading-relaxed">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  {addr.landmark && (
                    <p className="text-[var(--color-text-muted)]">
                      Landmark: {addr.landmark}
                    </p>
                  )}
                  <p>
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  <p className="pt-1.5 text-[var(--color-text-muted)]">
                    Phone: +91 {addr.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 mt-4 text-xs">
                <div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="font-medium text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="p-1.5 rounded hover:bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    title="Edit address"
                    aria-label={`Edit address for ${addr.fullName}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(addr.id)}
                    className="p-1.5 rounded hover:bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                    title="Delete address"
                    aria-label={`Delete address for ${addr.fullName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1614]/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-[8px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)]">
                {editingAddress ? "Edit Address" : "Add Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-[6px] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-xs text-[var(--color-error)] flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-[family-name:var(--font-body)]">
              <div>
                <label htmlFor="modal-name" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  Recipient Name *
                </label>
                <input
                  id="modal-name"
                  type="text"
                  required
                  placeholder="e.g. Priyadarshini Raman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-phone" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[var(--color-text-muted)] font-medium">
                    +91
                  </span>
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 pl-11 pr-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-line1" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  House / Flat No., Street, Area *
                </label>
                <input
                  id="modal-line1"
                  type="text"
                  required
                  placeholder="e.g. 12, Gandhi Road, T. Nagar"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-line2" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  Apartment / Suite / Floor (Optional)
                </label>
                <input
                  id="modal-line2"
                  type="text"
                  placeholder="e.g. Floor 3, Door 3B"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-landmark" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  Landmark (Optional)
                </label>
                <input
                  id="modal-landmark"
                  type="text"
                  placeholder="e.g. Near City Bank ATM"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-city" className="block font-semibold text-[var(--color-text-body)] mb-1">
                    City *
                  </label>
                  <input
                    id="modal-city"
                    type="text"
                    required
                    placeholder="e.g. Chennai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="modal-pincode" className="block font-semibold text-[var(--color-text-body)] mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    id="modal-pincode"
                    type="text"
                    required
                    placeholder="600017"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-state" className="block font-semibold text-[var(--color-text-body)] mb-1">
                  State / Union Territory *
                </label>
                <select
                  id="modal-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                  />
                  <span className="text-xs text-[var(--color-text-body)]">
                    Make this my default delivery address
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-[6px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1614]/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-[8px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 text-center">
            <AlertCircle className="h-10 w-10 text-[var(--color-error)] mx-auto mb-3" />
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[var(--color-text-primary)] mb-2">
              Delete Address?
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed">
              Are you sure you want to remove this delivery address? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-[6px] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-body)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-[6px] bg-[var(--color-error)] hover:opacity-90 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
