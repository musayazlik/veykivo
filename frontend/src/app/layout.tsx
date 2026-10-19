import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veykivo — Kurumsal Yazılım Geliştirme",
    template: "%s | Veykivo",
  },
  description:
    "Veykivo; işletmelere özel yazılım, web ve mobil uygulama, ERP/CRM ve otomasyon çözümleri tasarlar, geliştirir ve destekler.",
  applicationName: "Veykivo",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Veykivo",
    images: [{ url: "/images/og-default.jpg", width: 1200, height: 630, alt: "Veykivo" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0e2a2f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${schibsted.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
