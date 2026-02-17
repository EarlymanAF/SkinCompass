// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: {
    default: "SkinCompass – CS2-Skins fair vergleichen",
    template: "%s | SkinCompass",
  },
  description:
    "Vergleiche CS2-Skinpreise in Sekunden: Endpreise inkl. Gebühren & Währung, Live-Vergleich und 7-Tage-Preistrend.",
  alternates: { canonical: "https://skincompass.de" },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  openGraph: {
    type: "website",
    url: "https://skincompass.de",
    siteName: "SkinCompass",
    title: "SkinCompass – CS2-Skins fair vergleichen",
    description: "Echte Endpreise (inkl. Gebühren/FX), Live-Vergleich & 7-Tage-Trend.",
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
