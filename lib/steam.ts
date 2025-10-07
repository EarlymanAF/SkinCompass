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
export async function fetchSteamSkins(weapon: string): Promise<SteamSkin[]> {
  console.log(`Fetching skins for ${weapon} from Steam...`);
  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=100&query=${encodeURIComponent(
    weapon
  )}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Steam API request failed for ${weapon}`);
  }

  const data = await response.json();
  if (!data?.results) {
    console.warn(`No results for ${weapon}`);
    return [];
  }

  const skins: SteamSkin[] = data.results.map((item: any) => ({
    name: item.name,
    icon: `https://steamcommunity-a.akamaihd.net/economy/image/${item.asset_description?.icon_url || ""}`,
    price: item.sell_price_text || null,
    image: `https://steamcommunity-a.akamaihd.net/economy/image/${item.asset_description?.icon_url_large || item.asset_description?.icon_url || ""}`,
  }));

  console.log(`→ ${skins.length} skins fetched for ${weapon}`);
  return skins;
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

  const skins = await fetchSteamSkins(weapon);
  memoSet(cacheKey, skins, 10 * 60 * 1000); // cache for 10 minutes
  return skins;
}