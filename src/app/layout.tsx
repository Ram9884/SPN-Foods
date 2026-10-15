import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SPN Foods — Traditional Indian Health Foods",
    template: "%s | SPN Foods",
  },
  description:
    "Traditional Indian health mixes, spice powders, podis, masalas and snacks. Packaged with care for modern households.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://spn-foods.vercel.app"
  ),
  openGraph: {
    type: "website",
    siteName: "SPN Foods",
    locale: "en_IN",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <html lang="en-IN">
      <head />
      <body
        style={
          {
            "--font-logo": `"Instrument Serif", Georgia, serif`,
            "--font-heading": `"Instrument Serif", Georgia, serif`,
            "--font-product": `"Manrope", system-ui, sans-serif`,
            "--font-body": `"Manrope", system-ui, sans-serif`,
            "--font-price": `"Manrope", system-ui, sans-serif`,
            "--font-tamil": `"Noto Serif Tamil", serif`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkKey) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
