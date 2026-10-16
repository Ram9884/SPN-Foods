"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SSOCallbackHandler() {
  const clerk = useClerk();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If session or user is already active, navigate to home immediately
    if (clerk.user || clerk.session) {
      window.location.href = "/";
      return;
    }

    let isMounted = true;

    clerk
      .handleRedirectCallback({
        signInUrl: "/sign-in",
        signUpUrl: "/sign-up",
        signInFallbackRedirectUrl: "/",
        signUpFallbackRedirectUrl: "/",
        firstFactorUrl: "/sign-in",
        secondFactorUrl: "/sign-in",
      })
      .then(() => {
        if (isMounted) {
          window.location.href = "/";
        }
      })
      .catch((err: any) => {
        console.error("Clerk SSO callback error:", err);
        if (isMounted) {
          // If session was created despite catch, verify and navigate
          if (clerk.session || clerk.user) {
            window.location.href = "/";
            return;
          }
          const message =
            err?.errors?.[0]?.longMessage ||
            err?.errors?.[0]?.message ||
            err?.message ||
            "Unable to complete sign-in. Please try again or check browser privacy settings.";
          setErrorMsg(message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clerk, router]);

  if (errorMsg) {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <div className="p-6 max-w-md w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[12px] shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            !
          </div>
          <h2 className="font-[family-name:var(--font-heading)] text-xl text-[var(--color-text-primary)] mb-2">
            Authentication Issue
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-text-muted)] mb-5 leading-relaxed">
            {errorMsg}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-brand-primary)] text-white text-xs font-semibold rounded-[8px] hover:bg-[var(--color-brand-primary-dark)] transition-colors"
            >
              Back to Sign In
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)] text-xs font-semibold rounded-[8px] hover:bg-[var(--color-surface-sand)] transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)] font-medium">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
