import Link from "next/link";
import EmailSignup from "@/components/EmailSignup";
import Image from "next/image";
import MarketplaceTable from "@/components/MarketplaceTable";
export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
<header className="flex items-center justify-start py-6">
  <div className="relative">
    <Image
      src="/skincompass-logo.png"
      alt="SkinCompass Logo"
      width={320}   // ggf. 300–360 testen
      height={102}
      priority
      className="block"
    />
  </div>
</header>

{/* Hero */}
<section className="mt-12">
  <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
    CS2‑Skins vergleichen – schnell, transparent &amp; fair
  </h1>

  <p className="mt-6 text-lg md:text-xl text-gray-700/90 max-w-2xl">
    Finde den besten Preis: inklusive Marktplatz‑Gebühren, Währungsumrechnung
    und klarem 7‑Tage‑Preistrend. Vergleiche smarter – kaufe günstiger.
  </p>

  <div className="mt-8">
    <EmailSignup />
    <p className="mt-3 text-sm text-gray-500">
      Trage dich für Early‑Access ein. Kein Spam, nur Updates zum Launch.
    </p>
  </div>
</section>

      {/* Feature Cards */}
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          ["Echte Endpreise", "Alle Gebühren & Wechselkurse direkt einberechnet – Schluss mit Überraschungen."],
          ["Live-Vergleich", "Mehrere Marktplätze nebeneinander. Schnell erkennen, wo du am fairsten kaufst."],
          ["Preistrend (7 Tage)", "Kleine Sparkline zeigt dir sofort, ob sich ein Kauf gerade lohnt."],
        ].map(([title, desc]) => (
          <div
            key={title}
            className="border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition-shadow bg-white"
          >
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Subtle CTA band */}
      <section className="mt-16 rounded-2xl border border-gray-200 p-6 md:p-8 bg-gradient-to-br from-white to-gray-50">
        <div className="md:flex md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              Sei von Anfang an dabei
            </h2>
            <p className="text-gray-600 mt-2">
              Wir starten mit CS2-Skins und erweitern schrittweise. 
              Erhalte exklusive Updates zu neuen Marktplätzen, Funktionen & Preisanalysen.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <EmailSignup />
          </div>
        </div>
      </section>

           {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left side */}
          <p>© {new Date().getFullYear()} SkinCompass</p>

          {/* Right side: Links */}
          <div className="flex items-center gap-4">
            <Link href="/impressum" className="hover:text-gray-900 transition-colors">
              Impressum
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>
        </footer>
            <script
  type="application/ld+json"
  suppressHydrationWarning
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SkinCompass",
      "url": "https://skincompass.de",
      "logo": "https://skincompass.de/skincompass-logo.png"
    }),
  }}
/>
            </main>
          );
      }
