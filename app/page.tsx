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
const SEO_SECTIONS = [
  {
    title: "Der ultimative CS2 Marktplatz für clevere Investoren",
    body: "Die Welt der CS2 Skins ist komplex und fragmentiert. SkinCompass bündelt Daten und Werkzeuge, damit du fundiert entscheiden kannst, ob du CS2 Skins kaufen oder CS2 Skins verkaufen willst.",
  },
  {
    title: "Exakter CS2 Skins Preisvergleich in Echtzeit",
    body: "Unser marktübergreifender CS2 Skins Preisvergleich zeigt dir fortlaufend Angebote, Gebühren und Endpreise. So erkennst du günstige CS2 Skins schneller und findest den besten Zeitpunkt für Transaktionen.",
  },
  {
    title: "Optimieren Sie Ihr CS2 Inventar mit präzisen Daten",
    body: "Mit SkinCompass ermittelst du deinen CS2 Inventar Wert transparent und nachvollziehbar. Für strategisches CS2 Skin Trading liefern wir strukturierte Kennzahlen für Performance, Liquidität und Markttrends.",
  },
];
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
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            SkinCompass: Ihr Navigator für CS2 Skins, Preise und Portfolio-Tracking
          </h2>
          <p className="mt-2 text-secondary">
            SkinCompass ist Ihre zentrale Plattform für datenbasierte Entscheidungen im Handel mit Counter-Strike 2
            Skins. Wir vereinen Portfolio-Tracking und ein marktübergreifendes Vergleichsportal, um volle Transparenz
            über Preise, Trends und den Wert Ihres Inventars zu schaffen.
          </p>
        </section>

        <section className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
          <h3 className="text-xl font-semibold text-foreground">Unsere Vision: Transparenz für digitale Märkte</h3>
          <p className="mt-2 text-sm text-secondary">
            Wir starten mit dem Markt für CS2 Skins und erweitern schrittweise auf weitere digitale Märkte. Unser Ziel
            ist eine einheitliche Plattform für fundierte Entscheidungen über alle digitalen Assets hinweg.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            <li>• Portfolio-Tracking: Überwache den Wert deiner CS-Skins und anderer digitaler Assets in einem Dashboard.</li>
            <li>• Marktübergreifender Vergleich: Finde jederzeit den besten Preis über verschiedene Plattformen.</li>
            <li>• Datenbasierte Kennzahlen: Nutze standardisierte Daten für CS2 Skin Preise, Gebühren und Trends.</li>
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
            <h3 className="text-xl font-semibold text-foreground">Newsletter / Early Access</h3>
            <p className="mt-2 text-sm text-secondary">
              Trag dich ein und begleite den Aufbau von Anfang an. Kein Spam, nur relevante Produkt- und
              Markt-Updates.
            </p>
            <div className="mt-5">
              <EmailSignup />
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
            <h3 className="text-xl font-semibold text-foreground">Der Aufbau von SkinCompass</h3>
            <p className="mt-2 text-sm text-secondary">
              Unser Ziel ist es, den Handel und das Management digitaler Assets zu vereinfachen. Dafür verbinden wir
              Preisvergleich, Portfolio-Daten und klare Marktkennzahlen in einer Plattform.
            </p>
            <p className="mt-3 text-sm text-secondary">
              Von CS2 Skins aus bauen wir die Infrastruktur so, dass später weitere digitale Märkte mit denselben
              Qualitätsstandards angebunden werden.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {SEO_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
              <p className="mt-2 text-sm text-secondary">{section.body}</p>
            </article>
          ))}
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
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
