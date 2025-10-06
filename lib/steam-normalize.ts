// lib/steam-normalize.ts

// Zerlegt "<Weapon> | <Skin> (<Wear>)", optional mit "StatTrak™" oder "Souvenir"
export function parseHashName(hash: string): {
  weapon?: string;
  skin?: string;
  wear?: string;
  variant?: "StatTrak" | "Souvenir" | undefined;
} {
  let s = hash.trim();
  let variant: "StatTrak" | "Souvenir" | undefined;

  if (s.startsWith("StatTrak™ ")) {
    variant = "StatTrak";
    s = s.replace(/^StatTrak™\s+/, "");
  } else if (s.startsWith("Souvenir ")) {
    variant = "Souvenir";
    s = s.replace(/^Souvenir\s+/, "");
  }

  // Form: Weapon | Skin (Wear)
  const pipeIdx = s.indexOf(" | ");
  if (pipeIdx === -1) return {};
  const weapon = s.slice(0, pipeIdx).trim();

  const rest = s.slice(pipeIdx + 3).trim();
  const wearMatch = rest.match(/\(([^)]+)\)\s*$/);
  const wear = wearMatch ? wearMatch[1] : undefined;

  const skin = wear ? rest.replace(/\([^)]+\)\s*$/, "").trim() : rest;

  return { weapon, skin, wear, variant };
}

// Liefert "Skin" ohne Wear/StatTrak/Souvenir-Markierungen
export function baseSkinNameFromHash(hash: string): string | null {
  const p = parseHashName(hash);
  return p.skin ?? null;
}