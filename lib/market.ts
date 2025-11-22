// lib/market.ts
import type { WearEN } from "@/data/wears";

// Einige Items (Messer) führen einen Stern (★) im market_hash_name
const STAR_ITEMS_EXACT = new Set([
  "Bayonet",
  "Karambit",
  "M9 Bayonet",
  "Shadow Daggers",
]);

function needsStarPrefix(weapon: string): boolean {
  if (!weapon) return false;
  if (weapon.trim().startsWith("★")) return false; // bereits vorhanden
  if (weapon.includes("Knife")) return true; // generische Erkennung für Messer
  if (STAR_ITEMS_EXACT.has(weapon)) return true;
  return false;
}

export function toMarketHashName(weapon: string, skin: string, wear: WearEN): string {
  const base = `${weapon} | ${skin} (${wear})`;
  return needsStarPrefix(weapon) ? `★ ${base}` : base;
}