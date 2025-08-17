import Link from "next/link";
import EmailSignup from "@/components/EmailSignup";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mini-Logo: Kompasszeiger */}
          <div className="h-9 w-9 rounded-full border border-gray-300 grid place-items-center">
            <div className="h-3.5 w-0.5 bg-gray-900 rotate-45 origin-bottom" />
          </div>
          <span className="font-semibold text-lg tracking-tight">SkinCompass</span>
        </div>

        <nav className="text-sm flex items-center gap-6">
          <Link href="/impressum" className="text-gray-600 hover:text-gray-900">
            Impressum
          </Link>
          <Link href="/datenschutz" className="text-gray-600 hover:text-gray-900">
            Datenschutz
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mt-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          Dein Wegweiser zum <span className="text-gray-700">fairsten Preis</span>
          <br className="hidden md:block" />
          für CS2-Skins.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-700/90 max-w-2xl">
          Vergleiche Marktplätze in Sekunden – mit echten Endpreisen (inkl. Gebühren &amp; Währung)
          und einem klaren Preistrend der letzten 7 Tage. Präzision. Transparenz.{" "}
          <span className="whitespace-nowrap">Engineered in Germany.</span>
        </p>

        <div className="mt-8">
          <EmailSignup />
          <p className="mt-3 text-sm text-gray-500">
            Trage dich für Early-Access ein. Kein Spam, nur Updates zum Launch.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          ["Echte Endpreise", "Gebühren & FX im Blick. Keine Rechenakrobatik."],
          ["Live-Vergleich", "Mehrere Marktplätze nebeneinander, fair & transparent."],
          ["Preistrend (7 Tage)", "Mini-Historie als Sparkline für schnelle Einschätzung."],
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
              Früh dabei sein
            </h2>
            <p className="text-gray-600 mt-2">
              Wir starten mit CS2 und erweitern schrittweise. Sichere dir Updates zu
              neuen Marktplätzen, Funktionen &amp; Analysen.
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
          <p>© {new Date().getFullYear()} SkinCompass</p>
          <p>Precision engineered in Germany</p>
        </div>
      </footer>
    </main>
  );
}
