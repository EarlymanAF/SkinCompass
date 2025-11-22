// lib/steam.ts
import { unstable_cache } from "next/cache";

type SearchResult = { skins: string[]; count: number };

// deine Fetch-Logik für Steam-Skins
async function _fetchSkinsRaw(weapon: string): Promise<SearchResult> {
  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=100&query=${encodeURIComponent(weapon)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Steam API error");
  const json = (await res.json()) as any;
  return {
    skins: (json.results ?? []).map((r: any) => r.hash_name) ?? [],
    count: json.total_count ?? 0,
  };
}

// Cached-Funktion für Skins
export const getSkinsCached = unstable_cache(
  async (weapon: string) => _fetchSkinsRaw(weapon),
  ["steam-skins"], // statischer Key
  {
    revalidate: 60 * 60 * 6, // 6 Stunden Cache
    tags: ["steam-skins"],
  }
);