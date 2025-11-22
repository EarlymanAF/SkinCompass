// data/wears.ts

// Steam-Originalzustände (englische Bezeichner)
export type WearEN =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

// Liste aller Zustände
export const WEARS: WearEN[] = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

// Mapping: Englische Bezeichner → Deutsche Labels
export const WEAR_LABEL_DE: Record<WearEN, string> = {
  "Factory New": "Fabrikneu",
  "Minimal Wear": "Minimale Gebrauchsspuren",
  "Field-Tested": "Einsatzerprobt",
  "Well-Worn": "Abgenutzt",
  "Battle-Scarred": "Kampfspuren",
};