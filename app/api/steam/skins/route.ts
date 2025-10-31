import fs from "fs";
import path from "path";
import {
  getImageCacheKey,
  normalizeWeaponToken,
  extractWeaponFromMarketName,
} from "@/lib/skin-utils";
import skinsRaw from "@/data/skins.json";

type SteamSkinEntry = {
  weapon?: string;
  name?: string;
  wears?: string[];
  image?: string | null;
  [key: string]: unknown;
};

function buildCandidateSet(weapon: string | null): Set<string> {
  if (!weapon) return new Set();
  const normalized = normalizeWeaponToken(weapon);
  return normalized ? new Set([normalized]) : new Set();
}

function matchesWeaponEntry(
  entry: SteamSkinEntry,
  candidates: Set<string>,
  fallbackWeapon: string | null
) {
  if (candidates.size === 0 && fallbackWeapon) {
    const normalizedFallback = normalizeWeaponToken(fallbackWeapon);
    if (normalizedFallback) {
      candidates.add(normalizedFallback);
    }
  }

  if (candidates.size === 0) return false;

  const weaponField = entry.weapon ? normalizeWeaponToken(String(entry.weapon)) : null;
  const weaponFromName = extractWeaponFromMarketName(entry.name);

  if (weaponFromName && !candidates.has(weaponFromName)) {
    // Name explicitly references a different weapon → skip this entry
    return false;
  }

  if (weaponField && candidates.has(weaponField)) return true;

  if (weaponFromName && candidates.has(weaponFromName)) return true;

  return false;
}

const LOCAL_IMAGE_DIR = path.join(process.cwd(), "public", "skin-images");
const LOCAL_IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".avif"];
const imagePathCache = new Map<string, string | null>();

function resolveLocalImage(imageUrl: string | null | undefined): string | null | undefined {
  const key = getImageCacheKey(imageUrl);
  if (!key) return imageUrl ?? null;
  if (imagePathCache.has(key)) return imagePathCache.get(key) ?? null;

  for (const ext of LOCAL_IMAGE_EXTENSIONS) {
    const absolutePath = path.join(LOCAL_IMAGE_DIR, `${key}${ext}`);
    if (fs.existsSync(absolutePath)) {
      const publicPath = `/skin-images/${key}${ext}`;
      imagePathCache.set(key, publicPath);
      return publicPath;
    }
  }

  imagePathCache.set(key, null);
  return imageUrl ?? null;
}

function withLocalImage(entry: SteamSkinEntry): SteamSkinEntry {
  const resolvedImage = resolveLocalImage(entry.image);
  if (resolvedImage && resolvedImage !== entry.image) {
    return { ...entry, image: resolvedImage };
  }

  return entry;
}

function withLocalImages(entries: SteamSkinEntry[]): SteamSkinEntry[] {
  return entries.map(withLocalImage);
}

function normalizeSkins(): SteamSkinEntry[] {
  const dataSource: unknown = skinsRaw;

  if (Array.isArray(dataSource)) {
    return dataSource as SteamSkinEntry[];
  }

  if (dataSource && typeof dataSource === "object") {
    const source = dataSource as Record<string, unknown>;
    if (source.byWeapon && typeof source.byWeapon === "object") {
      return Object.values(source.byWeapon as Record<string, SteamSkinEntry[]>)
        .filter((v): v is SteamSkinEntry[] => Array.isArray(v))
        .flat();
    }

    return Object.values(source)
      .filter((v): v is SteamSkinEntry[] => Array.isArray(v))
      .flat();
  }

  console.warn("⚠️ Unexpected format of skins.json, returning empty array");
  return [];
}

const ALL_SKINS: SteamSkinEntry[] = normalizeSkins();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon");
    const skinFilter = searchParams.get("skin");

    imagePathCache.clear();

    const skins = ALL_SKINS;

    // Optional: if a specific weapon + skin is requested, return its entry (to expose wears)
    if (weapon && skinFilter) {
      const weaponLower = weapon.toLowerCase();
      const skinLower = skinFilter.toLowerCase();
      const match = skins.find((s) =>
        (s.weapon?.toString().toLowerCase() === weaponLower) &&
        (s.name?.toString().toLowerCase().includes(skinLower))
      );
      if (match) {
        return Response.json(withLocalImage(match), {
          headers: { "Cache-Control": "public, max-age=86400, immutable" },
        });
      }
      return Response.json({}, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    if (!weapon) {
      console.log(`✅ Loaded skins.json with total ${skins.length} skins`);
      return Response.json(withLocalImages(skins), {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    const candidates = buildCandidateSet(weapon);
    const filtered = skins.filter((s) => matchesWeaponEntry(s, candidates, weapon));

    console.log(`✅ Found ${filtered.length} skins matching weapon "${weapon}"`);

    return Response.json(withLocalImages(filtered), {
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("❌ Error loading skins.json:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Failed to load skins.json", details: message },
      { status: 500 }
    );
  }
}
