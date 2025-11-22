export type WearEN =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

export type Weapon = string;

export type Skin = {
  id: string;
  weapon: Weapon;
  name: string;
  stattrak?: boolean;
  souvenir?: boolean;
  // Jede Wear-Stufe, die tatsächlich existiert
  wears?: WearEN[];
  case?: string | null;
  collection?: string | null;
};

// Detailliertere Wear-Struktur
export interface WearVariant {
  wear: WearEN;
  image?: string; // lokales Bild oder Steam-URL
  price?: number; // optionaler Preis, falls bereits gecached
}

// Steam-spezifischer Typ
export interface SteamSkin {
  name: string;
  weapon: string;
  image: string;
  wears?: WearVariant[];
  stattrak?: boolean;
  souvenir?: boolean;
  rarity?: string;
  price?: number;
  case?: string | null;
  collection?: string | null;
}
