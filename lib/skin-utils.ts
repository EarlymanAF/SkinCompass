// lib/skin-utils.ts

export const WEAR_SUFFIXES = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
] as string[];

const WEAR_SUFFIXES_PAREN = WEAR_SUFFIXES.map((wear) => `(${wear})`);

/** Normalisiert Waffenbezeichnungen für zuverlässige Vergleiche. */
export function normalizeWeaponToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/★/g, "")
    .replace(/stattrak™?\s+/g, "")
    .replace(/souvenir\s+/g, "")
    .replace(/™/g, "")
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrahiert den Waffenanteil aus einem Market-/Skin-Namen. */
export function extractWeaponFromMarketName(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  let name = rawName.toLowerCase().trim();
  name = name.replace(/^★\s*/, "");
  name = name.replace(/^stattrak™?\s+/, "");
  name = name.replace(/^souvenir\s+/, "");
  const separator = name.indexOf(" | ");
  if (separator === -1) return null;
  return normalizeWeaponToken(name.slice(0, separator));
}

/** Removes wear suffixes and weapon prefixes (incl. ★ / StatTrak™ / Souvenir) from market names. */
export function stripWeaponPrefix(rawName: string, weapon: string): string {
  let name = rawName ?? "";

  for (const suffix of WEAR_SUFFIXES_PAREN) {
    if (name.endsWith(` ${suffix}`)) {
      name = name.slice(0, -1 * (suffix.length + 1));
      break;
    }
  }

  name = name.replace(/^★\s*/, "");
  name = name.replace(/^StatTrak™\s+/i, "");
  name = name.replace(/^Souvenir\s+/i, "");

  const prefix = `${weapon} | `;
  if (name.startsWith(prefix)) {
    name = name.slice(prefix.length);
  }

  return name.trim();
}

/** Creates a deterministic cache key for a Steam CDN image URL. */
export function getImageCacheKey(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const needle = "/economy/image/";
  const idx = imageUrl.indexOf(needle);
  if (idx === -1) return null;
  let key = imageUrl.slice(idx + needle.length);
  const qIdx = key.indexOf("?");
  if (qIdx !== -1) {
    key = key.slice(0, qIdx);
  }
  if (!key) return null;
  return key.replace(/[^a-z0-9._-]/gi, "_");
}
