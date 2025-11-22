// app/page.tsx
import EmailSignup from "@/components/EmailSignup";
import MarketplaceTable from "@/components/MarketplaceTable";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="mt-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          CS2-Skins vergleichen – schnell, transparent & fair
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-700/90 max-w-2xl">
          Finde den besten Preis für deine Counter-Strike 2 Skins: inklusive
          Marktplatz-Gebühren, Währungsumrechnungen und einem klaren
          7-Tage-Preistrend. Vergleiche smarter – kaufe günstiger.
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
          [
            "Echte Endpreise",
            "Alle Gebühren & Wechselkurse direkt einberechnet – Schluss mit Überraschungen.",
          ],
          [
            "Live-Vergleich",
            "Mehrere Marktplätze nebeneinander. Schnell erkennen, wo du am fairsten kaufst.",
          ],
          [
            "Preistrend (7 Tage)",
            "Kleine Sparkline zeigt dir sofort, ob sich ein Kauf gerade lohnt.",
          ],
          [
            "Alle Anbieter im Blick",
            "Suche nach jedem Skin und sieh direkt, welcher Händler, Marketplace oder Bot-Broker den besten Deal hat.",
          ],
          [
            "Inventar-Historie",
            "Wie ein Depot: verfolge Wert, Performance und Umsätze deines Accounts über Zeit.",
          ],
          [
            "Benachrichtigungen",
            "Alarme für Preisziele oder wenn ein Skin auf einem Marktplatz unter deinen Wunschpreis fällt.",
          ],
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

      {/* Provider coverage */}
      <section className="mt-16 border border-gray-200 rounded-2xl p-6 md:p-8 bg-white">
        <div className="md:flex md:items-start md:justify-between gap-8">
          <div className="md:max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-600">Anbieter-Abdeckung</p>
            <h2 className="text-2xl font-semibold tracking-tight mt-2">
              Finde jeden Skin – vergleiche alle relevanten Marktplätze
            </h2>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Wir indexieren offene Listings und Statistiken von Steam Community Market,
              Buff163, CSFloat, Skinport, Skinbaron, DMarket, ShadowPay und mehr. Für
              jede Kombination aus Skin, Wear und Pattern erhältst du Endpreise inkl.
              Gebühren sowie Verfügbarkeiten der beliebtesten Anbieter.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Gebühren- und Währungs-Normalisierung pro Marktplatz</li>
              <li>• Filtersuche nach Seltenheit, Kollektion, Wear-Range und Stickern</li>
              <li>• API-First: dieselben Daten für deine Tools oder Bots nutzbar</li>
            </ul>
          </div>
          <div className="mt-6 md:mt-0 grid grid-cols-2 gap-3 min-w-[240px]">
            {["Steam", "Buff163", "CSFloat", "Skinport", "Skinbaron", "DMarket"].map((provider) => (
              <div
                key={provider}
                className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                {provider}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inventory tracking section */}
      <section className="mt-16 grid md:grid-cols-2 gap-8 items-center">
        <div className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-600">Portfolio</p>
          <h2 className="text-2xl font-semibold tracking-tight mt-2">Dein Inventar wie ein Trading-Depot</h2>
          <p className="text-gray-600 mt-3 leading-relaxed">
            Verbinde dein Steam-Profil oder importiere deine Skins. Wir berechnen
            historische Werte, realisierte und unrealisierte Gewinne, Fees und den
            Performance-Verlauf – ähnlich wie bei Trade Republic, nur für virtuelle Items.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Tagesgenaue Zeitreihe deines Inventarwerts</li>
            <li>• Kauf-/Verkaufs-Historie mit Gebührenaufschlüsselung</li>
            <li>• Alerts bei starken Preisausschlägen oder Unterbewertung</li>
          </ul>
        </div>
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gesamtwert (Demo)</p>
              <p className="text-3xl font-semibold">€ 4.320,50</p>
            </div>
            <span className="text-sm font-semibold text-emerald-600">+8,4% vs. letzte 30 Tage</span>
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {[
              { name: "AK-47 | Redline (FT)", change: "+3,2%" },
              { name: "AWP | Asiimov (MW)", change: "+1,8%" },
              { name: "Karambit | Doppler (FN)", change: "+2,6%" },
              { name: "M4A1-S | Printstream (FT)", change: "+1,3%" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-gray-800">{item.name}</span>
                <span className="font-medium text-emerald-600">{item.change}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Beispielhafte Werte zur Veranschaulichung des Inventarverlaufs.</p>
        </div>
      </section>

      {/* Demo-Tabelle */}
      <MarketplaceTable />

      {/* Subtle CTA band */}
      <section className="mt-16 rounded-2xl border border-gray-200 p-6 md:p-8 bg-gradient-to-br from-white to-gray-50">
        <div className="md:flex md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              Sei von Anfang an dabei
            </h2>
            <p className="text-gray-600 mt-2">
              Wir starten mit CS2-Skins und erweitern schrittweise. Erhalte
              exklusive Updates zu neuen Marktplätzen, Funktionen &
              Preisanalysen.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <EmailSignup />
          </div>
        </div>
      </section>

    </main>
  );
}