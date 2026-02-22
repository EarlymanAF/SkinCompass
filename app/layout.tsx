// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
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
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
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
      </body>
    </html>
  );
}
