import fs from "fs";
import path from "path";
import {
  getImageCacheKey,
  normalizeWeaponToken,
  extractWeaponFromMarketName,
} from "@/lib/skin-utils";

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
    const candidatePath = path.join(LOCAL_IMAGE_DIR, `${key}${ext}`);
    if (fs.existsSync(candidatePath)) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon");
    const skinFilter = searchParams.get("skin");

    imagePathCache.clear();

    // Load skins.json dynamically from data
    const filePath = path.join(process.cwd(), "data", "skins.json");
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️  skins.json not found at:", filePath);
      // Fallback: try fetching from deployed URL if local file not found
      const remoteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.skincompass.de"}/data/skins.json`;
      console.log("🌐 Falling back to remote skins.json:", remoteUrl);
      try {
        const res = await fetch(remoteUrl);
        if (!res.ok) throw new Error(`Failed to fetch remote skins.json (${res.status})`);
        const remoteSkins = await res.json();
        return Response.json(remoteSkins, {
          headers: {
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      } catch (e) {
        console.error("❌ Could not fetch remote skins.json:", e);
        // Always return valid JSON (empty array fallback)
        return Response.json([], {
          headers: {
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    }

    let skinsRaw;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      skinsRaw = JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ Error reading or parsing local skins.json:", e);
      // Fallback to empty array
      return Response.json([], {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // Normalize skins into flat array (preserve wears and image when available)
    let skins: SteamSkinEntry[] = [];
    if (Array.isArray(skinsRaw)) {
      skins = skinsRaw;
    } else if (skinsRaw && typeof skinsRaw === "object") {
      // If skinsRaw has 'byWeapon' or other keys, merge all arrays into one
      if (skinsRaw.byWeapon && typeof skinsRaw.byWeapon === "object") {
        skins = Object.values(skinsRaw.byWeapon).flat() as SteamSkinEntry[];
      } else {
        // If not structured byWeapon, try to flatten all arrays in object values
        skins = Object.values(skinsRaw)
          .filter((v): v is SteamSkinEntry[] => Array.isArray(v))
          .flat();
      }
    } else {
      console.warn("⚠️ Unexpected format of skins.json, returning empty array");
      return Response.json([], {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

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
