import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

interface CallbackProps {
  searchParams: Promise<{
    redirect_url?: string;
  }>;
}

export default async function SignInSSOCallbackPage({ searchParams }: CallbackProps) {
  const sp = await searchParams;
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
