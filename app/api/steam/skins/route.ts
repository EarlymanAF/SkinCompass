import {
  normalizeWeaponToken,
  extractWeaponFromMarketName,
  weaponNameFromMarketName,
} from "@/lib/skin-utils";
import { WEARS, type WearEN } from "@/data/wears";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SteamSkinEntry = {
  weapon?: string;
  name?: string;
  wears?: string[];
  image?: string | null;
  case?: string | null;
  collection?: string | null;
  [key: string]: unknown;
};

const WEAPON_TRANSLATIONS: Record<string, string> = {
  "Akimbo-Berettas": "Dual Berettas",
  "Bowie-Messer": "Bowie Knife",
  "Falchion-Messer": "Falchion Knife",
  "Kukri-Messer": "Kukri Knife",
  "Navaja-Messer": "Navaja Knife",
  "Survival-Messer": "Survival Knife",
  "Talon-Messer": "Talon Knife",
  "Ursus-Messer": "Ursus Knife",
  "M9-Bajonett": "M9 Bayonet",
  "R8-Revolver": "R8 Revolver",
};

function translateWeaponName(name: string | undefined): string | undefined {
  if (!name) return name;
  const trimmed = name.trim();
  return WEAPON_TRANSLATIONS[trimmed] ?? trimmed;
}

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
    // Name refers to a different weapon
    return false;
  }

  if (weaponField && candidates.has(weaponField)) return true;
  if (weaponFromName && candidates.has(weaponFromName)) return true;

  return false;
}

function normalizeSkins(dataSource: unknown): SteamSkinEntry[] {
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

  return [];
}

const skinCache = new Map<string, SteamSkinEntry[]>();

async function loadLocalSkinData(): Promise<unknown> {
  try {
    const dataModule = await import("@/data/skins.json");
    return dataModule.default;
  } catch (err) {
    console.error("⚠️ Failed to load local skins.json:", err);
    return null;
  }
}

async function fetchRemoteSkinData(): Promise<unknown> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://www.skincompass.de";
  const remoteUrl = `${base}/data/skins.json`;
  try {
    console.log("🌐 Falling back to remote skins.json:", remoteUrl);
    const res = await fetch(remoteUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error(`❌ Remote skins.json responded with status ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("❌ Could not fetch remote skins.json:", err);
    return null;
  }
}

function sanitizeEntries(entries: SteamSkinEntry[]): SteamSkinEntry[] {
  const deduped = new Map<string, SteamSkinEntry>();

  for (const entry of entries) {
    let weapon = translateWeaponName(entry.weapon ?? undefined);
    const weaponFromName = weaponNameFromMarketName(entry.name ?? null);

    if (weaponFromName) {
      const translatedFromName = translateWeaponName(weaponFromName);
      if (!weapon || normalizeWeaponToken(weapon) !== normalizeWeaponToken(translatedFromName ?? weaponFromName)) {
        weapon = translatedFromName ?? weaponFromName;
      }
    }
    const name = entry.name?.trim();

    if (!weapon || !name) continue;

    const key = `${weapon.toLowerCase()}|${name.toLowerCase()}`;

    if (!deduped.has(key)) {
      deduped.set(key, {
        ...entry,
        weapon,
        name,
      });
    }
  }

  return Array.from(deduped.values());
}

async function loadSupabaseSkinData(weapon: string): Promise<SteamSkinEntry[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("skins")
      .select(`
        name,
        image_url,
        weapons!inner(name),
        skin_variants(wear_tier)
      `)
      .eq("weapons.name", weapon);

    if (error || !data || data.length === 0) return [];

    return data.map((row) => {
      const weaponName = Array.isArray(row.weapons)
        ? (row.weapons[0] as { name: string } | undefined)?.name
        : (row.weapons as { name: string } | null)?.name;
      const wears = (Array.isArray(row.skin_variants) ? row.skin_variants : [])
        .map((sv: { wear_tier: string }) => sv.wear_tier)
        .filter((w): w is WearEN => (WEARS as ReadonlyArray<string>).includes(w));
      return {
        weapon: weaponName ?? "",
        name: row.name,
        wears: wears.length > 0 ? wears : undefined,
        image: row.image_url ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function loadSkins(weapon: string | null): Promise<SteamSkinEntry[]> {
  const cacheKey = weapon ?? "__all__";
  if (skinCache.has(cacheKey)) return skinCache.get(cacheKey)!;

  let entries: SteamSkinEntry[] = [];

  // 1. Supabase (nur wenn eine Waffe angegeben ist)
  if (weapon) {
    entries = await loadSupabaseSkinData(weapon);
  }

  // 2. Fallback: lokale skins.json
  if (entries.length === 0) {
    const localData = await loadLocalSkinData();
    entries = sanitizeEntries(normalizeSkins(localData));
  }

  // 3. Fallback: Remote skins.json
  if (entries.length === 0) {
    const remoteData = await fetchRemoteSkinData();
    entries = sanitizeEntries(normalizeSkins(remoteData));
  }

  skinCache.set(cacheKey, entries);
  return entries;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon");
    const skinFilter = searchParams.get("skin");

    const skins = await loadSkins(weapon);

    if (weapon && skinFilter) {
      const weaponLower = weapon.toLowerCase();
      const skinLower = skinFilter.toLowerCase();
      const match = skins.find((s) =>
        s.weapon?.toString().toLowerCase() === weaponLower &&
        s.name?.toString().toLowerCase().includes(skinLower)
      );
      if (match) {
        return Response.json(match, {
          headers: { "Cache-Control": "public, max-age=86400, immutable" },
        });
      }
      return Response.json({}, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    if (!weapon) {
      console.log(`✅ Loaded skins with total ${skins.length} entries`);
      return Response.json(skins, {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // Wenn Supabase Ergebnisse lieferte, sind diese bereits nach weapon gefiltert.
    // Wenn der Fallback (skins.json) verwendet wurde, hier noch filtern.
    const candidates = buildCandidateSet(weapon);
    const allFromSupabase = skins.every((s) => s.weapon === weapon || s.weapon === "");
    const filtered = allFromSupabase
      ? skins
      : skins.filter((s) => matchesWeaponEntry(s, candidates, weapon));

    console.log(`✅ Found ${filtered.length} skins matching weapon "${weapon}"`);

    return Response.json(filtered, {
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("❌ Error loading skins:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Failed to load skins", details: message },
      { status: 500 }
    );
  }
}
