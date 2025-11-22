import type { Skin } from "@/lib/types";

const SKINS: Skin[] = [
  // ✅ Redline hat KEIN Factory New
  {
    id: "ak47-redline",
    weapon: "AK-47",
    name: "Redline",
    stattrak: true,
    wears: ["Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"],
  },
  // Beispiel: Asiimov hat alle (lassen wir ohne wears -> nutzt global)
  {
    id: "ak47-asiimov",
    weapon: "AK-47",
    name: "Asiimov",
    stattrak: true
  },
  // ✅ Deagle Blaze: nur FN & MW
  {
    id: "deagle-blaze",
    weapon: "Desert Eagle",
    name: "Blaze",
    stattrak: true,
    wears: ["Factory New", "Minimal Wear"],
  },
  // AWP Dragon Lore (Souvenir hat meist alle Wears, das passt)
  {
    id: "awp-dragon",
    weapon: "AWP",
    name: "Dragon Lore",
    souvenir: true
  },
];

export default SKINS;