"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SignInSSOCallbackPage() {
  return (
    <div className="py-20 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)]">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
