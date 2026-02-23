// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AnalyticsConsentBanner from "@/components/AnalyticsConsentBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { OG_DESCRIPTION, SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: SEO_TITLE,
    template: "%s | SkinCompass",
  },
  description: SEO_DESCRIPTION,
  keywords: [
    "cs2 skins",
    "cs2 skins preisvergleich",
    "cs2 inventar wert",
    "cs2 skin trading",
    "cs2 skins kaufen",
    "cs2 skins verkaufen",
    "cs2 skin preise",
    "digitale assets",
  ],
  alternates: { canonical: "https://skincompass.de" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://skincompass.de",
    siteName: "SkinCompass",
    title: SEO_TITLE,
    description: OG_DESCRIPTION,
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "SkinCompass Logo" }],
  },
  metadataBase: new URL("https://skincompass.de"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <AnalyticsConsentBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
