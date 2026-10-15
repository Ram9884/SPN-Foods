import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Create an Account — SPN Foods",
  description: "Create an SPN Foods account to track your orders, save addresses, and checkout faster.",
};

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface SignUpPageProps {
  searchParams: Promise<{
    redirect_url?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const sp = await searchParams;
  const redirectUrl = sp.redirect_url ?? "/";

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
            Create an Account
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-text-muted)] mt-1">
            Join SPN Foods for faster checkout and order tracking
          </p>
        </div>

        {HAS_CLERK ? (
          <div className="flex justify-center">
            <SignUp
              routing="path"
              path="/sign-up"
              fallbackRedirectUrl={redirectUrl}
              signInUrl="/sign-in"
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
