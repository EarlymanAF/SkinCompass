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
    id: "compare-shop-connectors",
    title: "Shop-Anbindungen im Vergleichsportal",
    description:
      "Wir binden schrittweise weitere Marktplätze an, damit Preise und Verfügbarkeit zentral vergleichbar sind.",
    userValue:
      "Du siehst mehr Angebote auf einen Blick und findest schneller den besten Endpreis.",
    lane: "now",
    status: "in_progress",
  },
  {
    id: "compare-total-price-quality",
    title: "Endpreis-Qualität pro Shop",
    description:
      "Gebühren, Währung und Shop-spezifische Preislogik werden je Anbieter konsistent auf Endpreis normalisiert.",
    userValue:
      "Vergleiche werden fairer, weil du keine versteckten Kosten manuell nachrechnen musst.",
    lane: "now",
    status: "in_progress",
  },
  {
    id: "steam-signin",
    title: "Anmeldung mit Steam",
    description:
      "Login via Steam OpenID, damit Nutzer ihren Account schneller verknüpfen und sicher authentifizieren können.",
    userValue:
      "Weniger Friction beim Einstieg und direkte Grundlage für personalisierte Funktionen.",
    lane: "next",
    status: "planned",
  },
  {
    id: "investment-tracking",
    title: "Investment-Tracking im Inventar",
    description:
      "Aufbau eines Trackings für Einstand, aktuellen Wert, Performance und Entwicklung über Zeit.",
    userValue:
      "Du kannst dein Skin-Portfolio wie ein Investment-Depot nachvollziehen und bewerten.",
    lane: "next",
    status: "planned",
  },
  {
    id: "alert-mvp",
    title: "Preisalarm vormerken",
    description: "Nutzer können Preisziele für konkrete Skin-Kombinationen speichern.",
    userValue: "Du wirst informiert, wenn ein interessanter Einstieg erreicht wird.",
    lane: "later",
    status: "planned",
  },
  {
    id: "message-center",
    title: "Alerts & Updates Center",
    description: "Relevante Produkt- und Marktinfos an einer Stelle.",
    userValue: "Wichtige Signale gehen nicht im Alltag unter.",
    lane: "later",
    status: "planned",
  },
  {
    id: "multi-market-expansion",
    title: "Anbindung weiterer digitaler Märkte",
    description:
      "Nach dem CS2-Start erweitern wir die Infrastruktur auf weitere digitale Asset-Märkte mit einheitlicher Datenbasis.",
    userValue:
      "Du kannst mehrere digitale Märkte zentral vergleichen und in einem gemeinsamen Portfolio verfolgen.",
    lane: "later",
    status: "planned",
  },
];
