import type { Metadata } from "next";
import { DM_Serif_Display, Lora, Manrope } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lora",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dm-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: "SPN Health Mix — Traditional Indian Health Foods",
    template: "%s | SPN Health Mix",
  },
  description:
    "Traditional Indian health mixes, spice powders, podis, masalas and snacks. Packaged with care for modern households.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://spn-foods.vercel.app"
  ),
  openGraph: {
    type: "website",
    siteName: "SPN Health Mix",
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
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head />
      <body
        className={`${lora.variable} ${dmSerifDisplay.variable} ${manrope.variable}`}
        style={
          {
            "--font-logo": `var(--font-lora), "Lora", Georgia, serif`,
            "--font-heading": `var(--font-dm-serif), "DM Serif Display", Georgia, serif`,
            "--font-product": `var(--font-manrope), "Manrope", system-ui, sans-serif`,
            "--font-body": `var(--font-manrope), "Manrope", system-ui, sans-serif`,
            "--font-price": `var(--font-manrope), "Manrope", system-ui, sans-serif`,
            "--font-tamil": `"Noto Serif Tamil", "Latha", serif`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
