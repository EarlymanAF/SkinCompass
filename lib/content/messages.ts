export type MessageKind = "product" | "market";
export type MessageState = "new" | "read";

export type MessageEntry = {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  state: MessageState;
  kind: MessageKind;
};

export const MESSAGE_FEED: MessageEntry[] = [
  {
    id: "m1",
    kind: "product",
    state: "new",
    title: "Vergleichsportal: Preis-Insights erweitert",
    summary: "Ab sofort zeigen wir neben Endpreis auch klare Entscheidungs-Hinweise.",
    timestamp: "Heute, 09:20",
  },
  {
    id: "m2",
    kind: "market",
    state: "new",
    title: "AWP-Segment mit erhöhter Intraday-Volatilität",
    summary: "Mehrere AWP-Skins zeigen kurzfristig höhere Preisstreuung als der 7d-Schnitt.",
    timestamp: "Heute, 07:45",
  },
  {
    id: "m3",
    kind: "product",
    state: "read",
    title: "Inventaransicht: Top- und Risikopositionen hinzugefügt",
    summary: "Dein Bestand wird jetzt in stabile und risikoreiche Positionen gegliedert.",
    timestamp: "Gestern, 18:10",
  },
  {
    id: "m4",
    kind: "market",
    state: "read",
    title: "Spread bei Mid-Tier Rifles gestiegen",
    summary: "Zwischen günstigstem und zweitgünstigem Angebot liegen wieder deutlichere Abstände.",
    timestamp: "Gestern, 12:30",
  },
];
