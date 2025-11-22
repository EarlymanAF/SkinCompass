// data/index.ts
import type { Skin, WearEN, Weapon } from "@/lib/types";
import SKINS_DATA from "./skins";

// Globale Wear-Stufen (EN als Systemwerte)
export const WEARS: WearEN[] = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

// Deutsche Labels für die Anzeige
export const WEAR_LABEL_DE: Record<WearEN, string> = {
  "Factory New": "Fabrikneu",
  "Minimal Wear": "Minimal abgenutzt",
  "Field-Tested": "Gebrauchsspuren",
  "Well-Worn": "Stark abgenutzt",
  "Battle-Scarred": "Kampfspuren",
};

// SKINS (aus TS-Datei)
export const SKINS: Skin[] = SKINS_DATA as Skin[];

// WEAPONS automatisch aus SKINS ableiten (kein weapons.json nötig)
export const WEAPONS: Weapon[] = Array.from(
  new Set(SKINS.map((s) => s.weapon))
);

// Falls ein Skin eigene Wears definiert → nutze diese, sonst global
export function getWearsFor(weapon: Weapon, skinName: string): WearEN[] {
  const s = SKINS.find((x) => x.weapon === weapon && x.name === skinName);
  return s?.wears?.length ? s.wears : WEARS;
}

// Steam/Market-Name (EN-Wear für API-Konsistenz)
export function toMarketHashName(q: {
  weapon: Weapon;
  skin: string;
  wear: WearEN;
  stattrak?: boolean;
  souvenir?: boolean;
}): string {
  const base = `${q.weapon} | ${q.skin}`;
  const wear = `(${q.wear})`;
  if (q.souvenir) return `Souvenir ${base} ${wear}`;
  if (q.stattrak) return `StatTrak\u2122 ${base} ${wear}`;
  return `${base} ${wear}`;
}