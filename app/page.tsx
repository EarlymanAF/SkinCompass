import EmailSignup from "@/components/EmailSignup";
import {
  ROADMAP_ITEMS,
  ROADMAP_LANE_LABELS,
  ROADMAP_STATUS_LABELS,
  type RoadmapLane,
  type RoadmapStatus,
} from "@/lib/content/roadmap";

const CONTACT_EMAIL = "info@skincompass.de";
const LANE_ORDER: RoadmapLane[] = ["now", "next", "later"];
const STATUS_STYLE: Record<RoadmapStatus, string> = {
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  planned: "border-slate-300 bg-slate-100 text-slate-700",
  shipped: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SkinCompass",
    url: "https://skincompass.de",
    inLanguage: "de",
    description:
      "SkinCompass ist die Plattform für CS2 Skins Preisvergleich, Portfolio-Tracking und datenbasierte Entscheidungen im digitalen Asset-Handel.",
    keywords: [
      "cs2 skins",
      "cs2 skins preisvergleich",
      "cs2 inventar wert",
      "cs2 skin trading",
      "cs2 skins kaufen",
      "cs2 skins verkaufen",
      "cs2 skin preise",
    ],
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-8">
        <section className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
          <h3 className="text-xl font-semibold text-foreground">Newsletter / Early Access</h3>
          <p className="mt-2 text-sm text-secondary">
            Trag dich ein und begleite den Aufbau von Anfang an. Kein Spam, nur relevante Produkt- und Markt-Updates.
          </p>
          <div className="mt-5 max-w-xl">
            <EmailSignup />
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Wir suchen Founding Team Members</h3>
              <p className="text-sm text-secondary">
                Du willst in einem sehr frühen Startup mitbauen? Dann melde dich direkt bei uns.
              </p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Remote / flexibel</p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">Produkt & Engineering</p>
              <h4 className="mt-1 text-lg font-semibold text-foreground">
                Founding Product Engineer (Full-Stack) - Portfolio Tracking
              </h4>
              <p className="mt-2 text-sm text-secondary">
                Fokus auf Investment-Tracking für Skins: saubere Datenmodelle, klare Logik und ein verlässliches
                Produktfundament.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li>• Abbildung von Kaufdatum, Einstandspreis, Gebühren und Bestandslogik</li>
                <li>• Performance-Tracking (realisiert / unrealisiert) über Zeit</li>
                <li>• Idealerweise Erfahrung im frühen Startup oder mit Gründung</li>
              </ul>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Bewerbung%20Founding%20Product%20Engineer`}
                className="mt-4 inline-block text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4"
              >
                Für diese Rolle bewerben
              </a>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Growth & Expansion</p>
              <h4 className="mt-1 text-lg font-semibold text-foreground">
                Founding Growth & Partnerships Lead - User Acquisition
              </h4>
              <p className="mt-2 text-sm text-secondary">
                Fokus auf Wachstum: mehr relevante Nutzer, mehr Reichweite und mehr Marktdurchdringung.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li>• Aufbau und Skalierung von Nutzerkanälen (organisch + paid)</li>
                <li>• Partnerships, Community und Multiplikatoren im digitalen Asset-Umfeld</li>
                <li>• Klare KPI-Steuerung entlang des gesamten Funnels</li>
              </ul>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Bewerbung%20Founding%20Growth%20Lead`}
                className="mt-4 inline-block text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4"
              >
                Für diese Rolle bewerben
              </a>
            </article>
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
          <h3 className="text-xl font-semibold text-foreground">Produktwünsche & Bewerbungen</h3>
          <p className="mt-2 text-sm text-secondary">
            Für Feature-Ideen, Integrationen, Partnerschaften oder Bewerbungen erreichst du uns direkt per E-Mail:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-block text-lg font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Roadmap</h3>
              <p className="text-sm text-secondary">Unser Weg vom CS-Startpunkt zur Plattform für digitale Märkte.</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Fokus kann sich durch Nutzerfeedback ändern
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {LANE_ORDER.map((lane) => {
              const entries = ROADMAP_ITEMS.filter((item) => item.lane === lane);
              return (
                <article key={lane} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {lane === "now" ? "Jetzt" : lane === "next" ? "Als Nächstes" : "Später"}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-foreground">{ROADMAP_LANE_LABELS[lane]}</h4>

                  <div className="mt-4 space-y-3">
                    {entries.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border bg-surface p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[entry.status]}`}
                          >
                            {ROADMAP_STATUS_LABELS[entry.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-secondary">{entry.description}</p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
              <span>SkinCompass: Ihr Navigator für </span>
              <span className="text-indigo-700">CS2 Skins</span>
              <span>, Preise und Portfolio-Tracking</span>
            </h1>
            <p className="text-secondary">
              <span>SkinCompass ist Ihre zentrale Plattform für datenbasierte Entscheidungen im Handel mit </span>
              <strong>Counter-Strike 2 Skins</strong>
              <span>
                . Wir vereinen ein leistungsstarkes Portfolio-Tracking mit einem marktübergreifenden Vergleichsportal,
                um Ihnen volle Transparenz über Preise, Trends und den Wert Ihres Inventars zu bieten. Unser Ziel ist
                es, den Handel und das Management von digitalen Assets zu revolutionieren.
              </span>
            </p>

            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              <span>Der ultimative </span>
              <span className="text-indigo-700">CS2 Marktplatz</span>
              <span> für clevere Investoren</span>
            </h2>
            <p className="text-secondary">
              <span>Die Welt der </span>
              <strong>cs2 skins</strong>
              <span>
                {" "}
                ist komplex und fragmentiert. Um erfolgreich zu sein, benötigen Sie präzise Daten und die richtigen
                Werkzeuge. SkinCompass bietet Ihnen eine umfassende Übersicht, die Ihnen hilft, fundierte
                Entscheidungen zu treffen, egal ob Sie{" "}
              </span>
              <strong>cs2 skins kaufen</strong>
              <span> oder </span>
              <strong>cs2 skins verkaufen</strong>
              <span>
                {" "}
                möchten. Verlassen Sie sich auf unsere Analysen, um den Markt zu verstehen und Ihre Strategie zu
                optimieren.
              </span>
            </p>

            <h3 className="text-lg font-semibold text-foreground md:text-xl">
              <span>Exakter </span>
              <span className="text-indigo-700">CS2 Skins</span>
              <span> Preisvergleich in Echtzeit</span>
            </h3>
            <p className="text-secondary">
              <span>
                Finden Sie stets die besten Angebote. Unsere Plattform analysiert kontinuierlich verschiedene
                Handelsplätze, um Ihnen einen transparenten{" "}
              </span>
              <strong>cs2 skins preisvergleich</strong>
              <span>
                {" "}
                zu liefern. So stellen Sie sicher, dass Sie nie zu viel bezahlen und immer den optimalen Zeitpunkt für
                Transaktionen finden. Wir helfen Ihnen,{" "}
              </span>
              <strong>günstige cs2 skins</strong>
              <span> zu identifizieren und Ihre Rendite zu maximieren.</span>
            </p>

            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              <span>Optimieren Sie Ihr CS2 Inventar mit präzisen Daten</span>
            </h2>
            <p className="text-secondary">
              <span>
                Ein klares Verständnis des eigenen Portfolios ist der Schlüssel zum Erfolg. Mit unserem Tool zur
                Ermittlung des{" "}
              </span>
              <strong>cs2 inventar wert</strong>
              <span>
                {" "}
                behalten Sie stets den Überblick über Ihre gesamten Bestände. Verfolgen Sie die Wertentwicklung Ihrer
                Kollektion und erkennen Sie Potenziale für gewinnbringendes{" "}
              </span>
              <strong>cs2 skin trading</strong>
              <span>. Unsere Plattform liefert Ihnen die notwendigen Kennzahlen, um strategisch zu handeln.</span>
            </p>

            <ul className="list-disc space-y-2 pl-5 text-secondary">
              <li>
                <strong className="text-foreground">Portfolio-Tracking:</strong>
                <span>
                  {" "}
                  Überwachen Sie den Wert Ihrer CS-Skins und anderer digitaler Assets in einem einheitlichen
                  Dashboard.
                </span>
              </li>
              <li>
                <strong className="text-foreground">Marktübergreifender Vergleich:</strong>
                <span>
                  {" "}
                  Finden Sie jederzeit den besten Preis, indem Sie Angebote über verschiedene Plattformen hinweg
                  vergleichen.
                </span>
              </li>
              <li>
                <strong className="text-foreground">Datenbasierte Kennzahlen:</strong>
                <span> Nutzen Sie standardisierte Daten für </span>
                <strong className="text-foreground">cs2 skin preise</strong>
                <span>, Gebühren und Trends, um schnellere und bessere Entscheidungen zu treffen.</span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              <span>Unsere Vision: Transparenz für digitale Märkte</span>
            </h2>
            <p className="text-secondary">
              <span>
                SkinCompass hat es sich zur Aufgabe gemacht, fragmentierte digitale Märkte zu verbinden und Nutzern
                eine Plattform für fundierte Entscheidungen zu bieten. Wir beginnen mit dem Markt für{" "}
              </span>
              <strong>Counter-Strike 2 Skins</strong>
              <span>
                {" "}
                und erweitern unser Angebot schrittweise, um Ihnen eine umfassende Lösung für alle Ihre digitalen
                Assets zu bieten. Seien Sie Teil unserer Reise und erleben Sie die Zukunft des digitalen Handels.
              </span>
            </p>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
