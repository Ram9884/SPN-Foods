import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AuthenticateWithRedirectCallback, SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In — SPN Foods",
  description: "Sign in to your SPN Foods account to manage your cart, orders, and addresses.",
};

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface SignInPageProps {
  params?: Promise<{
    "sign-in"?: string[];
  }>;
  searchParams: Promise<{
    redirect_url?: string;
    add?: string;
  }>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const [p, sp] = await Promise.all([
    params ? params : Promise.resolve(undefined),
    searchParams,
  ]);
  const isSsoCallback = p?.["sign-in"]?.includes("sso-callback");

  let redirectUrl = sp.redirect_url ?? "/";
  try {
    if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
      const parsed = new URL(redirectUrl);
      redirectUrl = parsed.pathname + parsed.search;
    }
  } catch {
    redirectUrl = "/";
  }
  if (!redirectUrl.startsWith("/")) {
    redirectUrl = "/" + redirectUrl;
  }
  if (sp.add && !redirectUrl.includes("add=")) {
    redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + `add=${encodeURIComponent(sp.add)}`;
  }

  if (isSsoCallback) {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[50vh] px-4">
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={redirectUrl}
          signUpFallbackRedirectUrl={redirectUrl}
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

  return (
    <div className="py-12 lg:py-20 flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex flex-col items-center group mb-2 rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
          >
            <Image
              src="/logo.png"
              alt="SPN Foods Emblem"
              width={64}
              height={64}
              priority
              className="w-16 h-16 rounded-full object-contain drop-shadow-md mb-2.5 transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-[family-name:var(--font-logo)] text-2xl font-bold text-[var(--color-brand-primary)]">
              SPN Foods
            </span>
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[var(--color-text-primary)]">
            Welcome Back
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)] mt-1">
            Sign in to access your cart and continue checkout
          </p>
        </div>

        {HAS_CLERK ? (
          <div className="flex justify-center">
            <SignIn
              routing="path"
              path="/sign-in"
              fallbackRedirectUrl={redirectUrl}
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] rounded-[8px]",
                  formButtonPrimary:
                    "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white text-sm font-semibold rounded-[8px] h-11",
                  footerActionLink: "text-[var(--color-brand-primary)] hover:underline",
                },
              }}
            />
          </div>
        ) : (
          <div className="p-6 rounded-[8px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center">
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-body)] mb-4">
              Clerk authentication is not configured in this environment (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set).
            </p>
            <Link
              href={redirectUrl}
              className="inline-flex items-center justify-center h-11 px-6 font-[family-name:var(--font-body)] font-semibold text-sm text-white bg-[var(--color-brand-primary)] rounded-[8px] hover:bg-[var(--color-brand-primary-dark)] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] shadow-xs"
            >
              Continue back to shop
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
