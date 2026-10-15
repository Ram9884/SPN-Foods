"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, Mail, Edit3, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
}

export function ProfileSection() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) {
        const data: ProfileData = await res.json();
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (cleanName.length === 0) {
      setError("Please enter your name.");
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-().]/g, "");
    if (cleanPhone.length > 0 && !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number (or leave blank).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone || null,
        }),
      });

      const updated = await res.json();
      if (!res.ok) {
        setError(updated.message || "Failed to update profile details.");
        showToast("Could not update profile.", "error");
        return;
      }

      setProfile(updated);
      setIsEditing(false);
      showToast("Profile details updated successfully.", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Network error while updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-6 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] animate-pulse">
        <div className="h-5 w-32 bg-[var(--color-surface-sunken)] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-48 bg-[var(--color-surface-sunken)] rounded" />
          <div className="h-4 w-64 bg-[var(--color-surface-sunken)] rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <section
      aria-labelledby="profile-heading"
      className="p-6 sm:p-8 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xs)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6">
        <div>
          <h2
            id="profile-heading"
            className="font-[family-name:var(--font-heading)] text-xl text-[var(--color-text-primary)]"
          >
            Personal Details
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-text-muted)] mt-0.5">
            Your contact details used for orders and shipping.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold font-[family-name:var(--font-body)] text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-3 rounded-[6px] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-xs font-[family-name:var(--font-body)] text-[var(--color-error)]"
        >
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 max-w-lg font-[family-name:var(--font-body)]">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-xs font-semibold text-[var(--color-text-body)] mb-1"
            >
              Full Name
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="edit-phone"
              className="block text-xs font-semibold text-[var(--color-text-body)] mb-1"
            >
              Mobile Number (10 digits)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[var(--color-text-muted)] font-medium">
                +91
              </span>
              <input
                id="edit-phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className="w-full h-10 pl-11 pr-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-primary)]"
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Optional. Used for delivery updates.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)]/60 text-sm text-[var(--color-text-muted)]">
              <Mail className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              <span>{profile.email}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Managed securely through your sign-in identity.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-[8px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.98] text-white text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {saving && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setIsEditing(false);
                setName(profile.name ?? "");
                setPhone(profile.phone ?? "");
                setError(null);
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-[8px] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] active:scale-[0.98] text-xs font-medium text-[var(--color-text-body)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-[family-name:var(--font-body)] text-sm">
          <div>
            <dt className="text-xs text-[var(--color-text-muted)] font-medium mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              <span>Full Name</span>
            </dt>
            <dd className="font-semibold text-[var(--color-text-primary)]">
              {profile.name || "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--color-text-muted)] font-medium mb-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              <span>Email Address</span>
            </dt>
            <dd className="font-semibold text-[var(--color-text-primary)]">
              {profile.email}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--color-text-muted)] font-medium mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              <span>Mobile Number</span>
            </dt>
            <dd className="font-semibold text-[var(--color-text-primary)]">
              {profile.phone ? `+91 ${profile.phone}` : "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--color-text-muted)] font-medium mb-1">
              Member Since
            </dt>
            <dd className="font-medium text-[var(--color-text-muted)] text-xs">
              {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
