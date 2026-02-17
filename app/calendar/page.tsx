import Link from "next/link";
import { Clock3, Flag, Rocket } from "lucide-react";
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

const LANE_STYLE: Record<
  RoadmapLane,
  {
    phase: string;
    summary: string;
    cardGradient: string;
    chip: string;
  }
> = {
  now: {
    phase: "Jetzt",
    summary: "Aktive Umsetzung",
    cardGradient: "from-indigo-500/15 to-violet-500/5",
    chip: "bg-indigo-100 text-indigo-700",
  },
  next: {
    phase: "Als Nächstes",
    summary: "Direkt danach geplant",
    cardGradient: "from-sky-500/12 to-indigo-500/5",
    chip: "bg-sky-100 text-sky-700",
  },
  later: {
    phase: "Später",
    summary: "Nachgelagerte Ausbaustufen",
    cardGradient: "from-slate-500/10 to-slate-500/5",
    chip: "bg-slate-100 text-slate-700",
  },
};

export default function CalendarPage() {
  const updatedAt = "17.02.2026";

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8">
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Roadmap</h1>
        <p className="mt-2 max-w-3xl text-secondary">
          Transparente Prioritäten für die nächsten Iterationen. Die Reihenfolge zeigt Fokus, keine
          festen Liefertermine.
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          Aktueller Fokus: Shop-Anbindungen im Vergleichsportal, Steam-Anmeldung und Investment-Tracking.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <span>Zuletzt aktualisiert: {updatedAt}</span>
          <span>Prioritäten können sich durch Nutzerfeedback und Daten verschieben.</span>
        </div>
      </section>

      <section className="relative mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Interaktiver Zeitstrahl</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Hover auf einen Abschnitt
          </span>
        </div>

        <div className="pointer-events-none absolute left-10 right-10 top-[124px] hidden h-[2px] bg-gradient-to-r from-indigo-300 via-sky-300 to-slate-300 md:block" />

        <div className="grid gap-4 md:grid-cols-3">
          {LANE_ORDER.map((lane) => {
            const entries = ROADMAP_ITEMS.filter((item) => item.lane === lane);
            const primaryStatus: RoadmapStatus = entries.some((entry) => entry.status === "in_progress")
              ? "in_progress"
              : entries.some((entry) => entry.status === "planned")
                ? "planned"
                : "shipped";
            const icon =
              lane === "now" ? (
                <Clock3 size={16} />
              ) : lane === "next" ? (
                <Rocket size={16} />
              ) : (
                <Flag size={16} />
              );

            return (
              <article
                key={lane}
                className={`group relative rounded-2xl border border-border bg-gradient-to-br ${LANE_STYLE[lane].cardGradient} p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-foreground">
                    {icon}
                  </span>
                  <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {entries.length} Schritte
                  </span>
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{LANE_STYLE[lane].phase}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{ROADMAP_LANE_LABELS[lane]}</h3>
                <p className="mt-1 text-sm text-secondary">{LANE_STYLE[lane].summary}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LANE_STYLE[lane].chip}`}>
                    {ROADMAP_STATUS_LABELS[primaryStatus]}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[primaryStatus]}`}>
                    {entries.length} geplant
                  </span>
                </div>

                <div className="pointer-events-none absolute left-0 right-0 top-[calc(100%+12px)] z-30 hidden translate-y-2 rounded-2xl border border-border bg-white p-4 opacity-0 shadow-lg transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Geplante Schritte</p>
                  <div className="mt-3 space-y-2">
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
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Feedback</h2>
        <p className="mt-2 text-secondary">
          Du willst ein Feature priorisieren? Teile uns kurz mit, was dir den höchsten Mehrwert bringt.
        </p>
        <Link
          href="mailto:info@skincompass.de?subject=Roadmap%20Feedback%20SkinCompass"
          className="mt-4 inline-flex rounded-button bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Feature-Wunsch senden
        </Link>
      </section>
    </main>
  );
}
