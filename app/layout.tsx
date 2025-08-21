// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// Optional & DSGVO-freundlich: anonyme Metriken
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "SkinCompass – CS2-Skins fair vergleichen",
    template: "%s | SkinCompass",
  },
  description:
    "Vergleiche CS2-Skinpreise in Sekunden: Endpreise inkl. Gebühren & Währung, Live-Vergleich und 7-Tage-Preistrend.",
  alternates: {
    canonical: "https://skincompass.de",
  },
  // nutzt dein app/icon.png automatisch
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://skincompass.de",
    siteName: "SkinCompass",
    title: "SkinCompass – CS2-Skins fair vergleichen",
    description:
      "Echte Endpreise (inkl. Gebühren/FX), Live-Vergleich & 7-Tage-Trend.",
    images: [
      { url: "/icon.png", width: 512, height: 512, alt: "SkinCompass Logo" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
        {/* Optional: anonyme Metriken */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}