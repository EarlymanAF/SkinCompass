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
  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-8">
      <section>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          SkinCompass verbindet Portfolio-Tracking mit einem marktübergreifenden Vergleichsportal.
        </h2>
        <p className="mt-2 text-secondary">
          Wir starten mit CS-Skins und erweitern schrittweise auf weitere digitale Märkte. Unser Ziel ist volle
          Transparenz für Preise, Gebühren, Liquidität und Performance über Plattformgrenzen hinweg.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
          <h3 className="text-xl font-semibold text-foreground">Newsletter / Early Access</h3>
          <p className="mt-2 text-sm text-secondary">
            Trag dich ein und begleite den Aufbau von Anfang an. Kein Spam, nur relevante Produkt- und Markt-Updates.
          </p>
          <div className="mt-5">
            <EmailSignup />
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8 shadow-card">
          <h3 className="text-xl font-semibold text-foreground">Unsere Vision</h3>
          <p className="mt-2 text-sm text-secondary">
            SkinCompass verbindet fragmentierte digitale Märkte in einer Plattform für datenbasierte Entscheidungen.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            <li>• Portfolio-Tracking für CS-Skins und weitere digitale Assets in einem einheitlichen Dashboard</li>
            <li>• Vergleichsportal über Marktplätze hinweg, um jederzeit den günstigsten Endpreis zu finden</li>
            <li>• Standardisierte Kennzahlen für Preis, Gebühren und Trends für schnellere Entscheidungen</li>
          </ul>
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
    </main>
  );
}
