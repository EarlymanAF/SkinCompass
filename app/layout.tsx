// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: {
    default: "SkinCompass – Coming Soon",
    template: "%s | SkinCompass",
  },
  description:
    "SkinCompass baut Portfolio-Tracking und Preisvergleich für CS-Skins und weitere digitale Märkte.",
  alternates: { canonical: "https://skincompass.de" },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  openGraph: {
    type: "website",
    url: "https://skincompass.de",
    siteName: "SkinCompass",
    title: "SkinCompass – Coming Soon",
    description: "Portfolio-Tracking und Preisvergleich für CS-Skins und weitere digitale Märkte.",
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
