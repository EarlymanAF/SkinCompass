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

export const PRODUCT_EVENT_NAMES = [
  "compare_opened",
  "compare_weapon_selected",
  "compare_skin_selected",
  "compare_wear_selected",
  "compare_search_submitted",
  "compare_results_shown",
  "compare_no_results",
  "signup_submitted",
  "signup_confirmed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventProps = Record<string, string | number | boolean | null>;

export type ProductEvent = {
  eventName: ProductEventName;
  sessionId?: string | null;
  userId?: string | null;
  page?: string | null;
  props?: ProductEventProps;
  createdAt?: string | null;
};
