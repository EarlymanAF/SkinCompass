export type CompareInsight = {
  id: string;
  title: string;
  description: string;
};

export const BASE_COMPARE_INSIGHTS: CompareInsight[] = [
  {
    id: "i1",
    title: "Endpreis ist die Leitmetrik",
    description: "Gebühren und Währung sind bereits eingerechnet. Vergleiche immer den Endpreis.",
  },
  {
    id: "i2",
    title: "Trend dient als Timing-Hilfe",
    description: "Ein negativer 7d-Trend kann auf kurzfristig günstigere Einstiege hindeuten.",
  },
  {
    id: "i3",
    title: "Spread pruefen vor Kauf",
    description: "Großer Preisabstand zwischen Platz 1 und 2 signalisiert möglichen Marktvorteil.",
  },
];
