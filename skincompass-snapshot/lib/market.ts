// lib/market.ts
import type { WearEN } from "@/data/wears";

export function toMarketHashName(weapon: string, skin: string, wear: WearEN): string {
  // Steam-Format: "Weapon | Skin (Wear)"
  return `${weapon} | ${skin} (${wear})`;
}