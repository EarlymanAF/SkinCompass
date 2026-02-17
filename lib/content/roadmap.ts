export type RoadmapLane = "now" | "next" | "later";
export type RoadmapStatus = "in_progress" | "planned" | "shipped";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  userValue: string;
  lane: RoadmapLane;
  status: RoadmapStatus;
};

export const ROADMAP_LANE_LABELS: Record<RoadmapLane, string> = {
  now: "Now",
  next: "Next",
  later: "Later",
};

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  in_progress: "In Arbeit",
  planned: "Geplant",
  shipped: "Ausgeliefert",
};

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: "alert-mvp",
    title: "Preisalarm vormerken",
    description: "Nutzer können Preisziele für konkrete Skin-Kombinationen speichern.",
    userValue: "Du wirst informiert, wenn ein interessanter Einstieg erreicht wird.",
    lane: "now",
    status: "in_progress",
  },
  {
    id: "compare-insights",
    title: "Entscheidungs-Insights im Vergleich",
    description: "Preisabstand, Trendkontext und Markt-Hinweise direkt bei Ergebnissen.",
    userValue: "Bessere Entscheidungen ohne externe Recherche.",
    lane: "now",
    status: "in_progress",
  },
  {
    id: "inventory-health",
    title: "Portfolio-Risikoansicht",
    description: "Trennung in stabile Positionen, Risiko-Items und veränderte Trends.",
    userValue: "Schneller Blick auf Risiken und Chancen im Inventar.",
    lane: "next",
    status: "planned",
  },
  {
    id: "message-center",
    title: "Alerts & Updates Center",
    description: "Relevante Produkt- und Marktinfos an einer Stelle.",
    userValue: "Wichtige Signale gehen nicht im Alltag unter.",
    lane: "next",
    status: "planned",
  },
  {
    id: "api-signal-layer",
    title: "Signal-Layer für Preisereignisse",
    description: "Regelwerk für Ereignisse wie starke Bewegungen und Spreads.",
    userValue: "Mehr Kontext statt reiner Rohpreise.",
    lane: "later",
    status: "planned",
  },
  {
    id: "dashboard-foundation",
    title: "Dashboard-Designsystem",
    description: "Einheitliches Layout mit Sidebar, Topbar und konsistenten Komponenten.",
    userValue: "Bessere Orientierung und schnellere Nutzung.",
    lane: "later",
    status: "shipped",
  },
];
