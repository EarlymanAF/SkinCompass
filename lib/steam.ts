import fs from "fs";
import path from "path";
import { memoGet, memoSet } from "./memo";

// Basic Steam Skin type
export interface SteamSkin {
  name: string;
  icon: string;
  price?: string | null;
  image?: string;
}

// Fetch skins for a given weapon directly from the Steam Community Market
export async function fetchSteamSkins(weapon: string): Promise<{ skins: SteamSkin[]; hasMore: boolean }> {
  console.log(`🔫 Fetching skins for ${weapon}...`);
  const filePath = path.join("data/cached", `${weapon}.json`);
  const skins: SteamSkin[] = [];

  // Wenn Cache-Datei existiert, direkt laden
  if (fs.existsSync(filePath)) {
    const cached = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SteamSkin[];
    console.log(`💾 Loaded ${cached.length} cached skins for ${weapon}`);
    return { skins: cached, hasMore: false };
  }

  let start = 0;
  const count = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=${count}&start=${start}&query=${encodeURIComponent(weapon)}`;

    console.log(`  → Fetching page ${start / count + 1} for ${weapon}...`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Steam API failed for ${weapon} (status ${response.status})`);
      break;
    }

    const data = await response.json();
    if (!data?.results?.length) {
      console.warn(`⚠️ No results found on page ${start / count + 1} for ${weapon}`);
      break;
    }

    const pageSkins = data.results.map((item: any) => ({
      name: item.name,
      icon: `https://steamcommunity-a.akamaihd.net/economy/image/${item.asset_description?.icon_url || ""}`,
      price: item.sell_price_text || null,
      image: `https://steamcommunity-a.akamaihd.net/economy/image/${item.asset_description?.icon_url_large || item.asset_description?.icon_url || ""}`,
    }));

    skins.push(...pageSkins);
    console.log(`  → Collected ${skins.length} total skins so far...`);

    hasMore = data.results.length === count;
    start += count;

    // Kurze Pause (500 ms), um Steam nicht zu überlasten
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Cache speichern
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(skins, null, 2));
  console.log(`✅ Done ${weapon} (${skins.length} skins total)`);

  return { skins, hasMore: false };
}

// Optional: Write cache file
export function cacheSkins(weapon: string, skins: SteamSkin[]) {
  const filePath = path.join("data/cached", `${weapon}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(skins, null, 2));
  console.log(`✅ Cached ${skins.length} skins for ${weapon}`);
}

// Cached version to avoid repeated API calls within 10 minutes
export async function getSteamSkinsCached(weapon: string): Promise<SteamSkin[]> {
  const cacheKey = `steam_skins_${weapon}`;
  const cached = memoGet<SteamSkin[]>(cacheKey);
  if (cached) return cached;

  const { skins } = await fetchSteamSkins(weapon);
  memoSet(cacheKey, skins, 10 * 60 * 1000); // cache for 10 minutes
  return skins;
}