import Link from "next/link";
import {
  ROADMAP_ITEMS,
  ROADMAP_LANE_LABELS,
  ROADMAP_STATUS_LABELS,
  type RoadmapLane,
  type RoadmapStatus,
} from "@/lib/content/roadmap";

const LANE_ORDER: RoadmapLane[] = ["now", "next", "later"];

const STATUS_STYLE: Record<RoadmapStatus, string> = {
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  planned: "border-slate-300 bg-slate-100 text-slate-700",
  shipped: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const LANE_BACKGROUND: Record<RoadmapLane, string> = {
  now: "from-indigo-500/15 to-violet-500/5",
  next: "from-sky-500/12 to-indigo-500/5",
  later: "from-slate-500/10 to-slate-500/5",
};

export default function CalendarPage() {
  const updatedAt = "09.02.2026";

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8">
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Roadmap</h1>
        <p className="mt-2 max-w-3xl text-secondary">
          Transparente Prioritäten für die nächsten Iterationen. Die Reihenfolge zeigt Fokus, keine
          festen Liefertermine.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <span>Zuletzt aktualisiert: {updatedAt}</span>
          <span>Prioritäten können sich durch Nutzerfeedback und Daten verschieben.</span>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        {LANE_ORDER.map((lane) => {
          const entries = ROADMAP_ITEMS.filter((item) => item.lane === lane);
          return (
            <article
              key={lane}
              className={`rounded-[24px] border border-border bg-gradient-to-br ${LANE_BACKGROUND[lane]} p-5 shadow-card`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{ROADMAP_LANE_LABELS[lane]}</h2>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
                  {entries.length} Punkte
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[entry.status]}`}
                      >
                        {ROADMAP_STATUS_LABELS[entry.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-secondary">{entry.description}</p>
                    <p className="mt-3 text-xs font-medium text-muted">Nutzen: {entry.userValue}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Feedback</h2>
        <p className="mt-2 text-secondary">
          Du willst ein Feature priorisieren? Teile uns kurz mit, was dir den höchsten Mehrwert bringt.
        </p>
        <Link
          href="mailto:investor@skincompass.de?subject=Roadmap%20Feedback%20SkinCompass"
          className="mt-4 inline-flex rounded-button bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Feature-Wunsch senden
        </Link>
      </section>
    </main>
  );
}
