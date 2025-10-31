import { SteamSkin } from "@/lib/types";
import { baseSkinNameFromHash } from "@/lib/steam-normalize";

function buildSteamUrl(weapon: string, skinName: string, wear: string) {
  const cleanName = skinName.replace(/\(.*?\)/, `(${wear})`);
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(cleanName)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSteamSkins(weapon: string, wear: string, page: number = 0): Promise<{ skins: SteamSkin[]; hasMore: boolean }> {
  const perPage = 100;
  const start = page * perPage;
  const query = encodeURIComponent(`${weapon} ${wear}`);

  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=${perPage}&start=${start}&query=${query}`;
  console.log(`🌐 Fetching ${weapon} - ${wear} (page ${page}) → ${url}`);

  let waitTime = 3000;

  while (true) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SkinCompassBot/1.0; +https://skincompass.de)"
      }
    });

    if (res.status === 429) {
      console.warn(`⚠️ Rate limit hit for ${weapon} - ${wear} (page ${page}). Waiting ${waitTime / 1000}s...`);
      await sleep(waitTime);
      waitTime = Math.min(waitTime * 2, 60000);
      continue;
    }

    if (!res.ok) throw new Error(`Steam API request failed for ${weapon} - ${wear} (${res.status})`);

    const data = await res.json();

    if ((data?.results || []).length === 0) {
      // No results for this wear, skip
      return { skins: [], hasMore: false };
    }

    const results = (data?.results || []).map((item: any) => {
      const hashName = item.hash_name || item.name || "";
      const parsedBase = baseSkinNameFromHash(hashName) || hashName.replace(/.*\|\s*/, "").replace(/\(.*?\)$/, "").trim();
      const iconPath = item.asset_description?.icon_url_large || item.asset_description?.icon_url || null;
      const image = iconPath ? `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}` : null;
      return {
        name: parsedBase,
        image,
        price: item.sell_price_text || null,
        weapon,
        wear,
        steamUrl: buildSteamUrl(weapon, hashName, wear)
      } as any;
    });

    const hasMore = data?.total_count > start + results.length;
    console.log(`📄 Page ${page}: fetched ${results.length} skins for ${weapon} - ${wear}`);
    return { skins: results, hasMore };
  }
}


async function run() {
  const fs = await import("fs/promises");
  const path = await import("path");

  const weaponsPath = path.resolve("data/weapons.json");
  const cachedDir = path.resolve("data/cached");
  const publicSkinsDir = path.resolve("public/skins");

  // Load all weapons
  const weaponsData = await fs.readFile(weaponsPath, "utf-8");
  const argWeapon = process.argv[2];
  const weapons: string[] = (JSON.parse(weaponsData) as string[]).filter(w => !argWeapon || w === argWeapon);
  // const weapons: string[] = JSON.parse(weaponsData);

  // Ensure cache dir
  try {
    await fs.access(cachedDir);
  } catch {
    await fs.mkdir(cachedDir, { recursive: true });
  }
  // Ensure public/skins dir
  try {
    await fs.access(publicSkinsDir);
  } catch {
    await fs.mkdir(publicSkinsDir, { recursive: true });
  }

  const wears = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

  for (const weapon of weapons) {
    console.log(`🛠️ Fetching all skins for: ${weapon}`);
    // Aggregate by base skin name to collect available wears
    const bySkin = new Map<string, { weapon: string; name: string; wears: Set<string>; image?: string | null }>();

    for (const wear of wears) {
      console.log(`🔍 Fetching wear condition: ${wear}`);
      let page = 0;
      let hasMore = true;

      while (hasMore && page < 50) {
        const { skins, hasMore: more } = await fetchSteamSkins(weapon, wear, page);
        if (skins.length === 0 && page === 0) {
          console.log(`⚠️ No skins found for ${weapon} with wear ${wear}, skipping this wear.`);
          break; // Skip to next wear
        }
        for (const s of skins) {
          const key = s.name;
          const entry = bySkin.get(key) || { weapon, name: s.name, wears: new Set<string>(), image: s.image ?? null };
          entry.wears.add(wear);
          if (!entry.image && s.image) entry.image = s.image;
          bySkin.set(key, entry);
        }
        hasMore = more;
        page++;
        if (hasMore) {
          await sleep(1000); // 1 sec between pages (verlangsamt wegen Steam-Rate-Limit)
        }
      }
    }

    // Expand to output schema with sorted wears array
    const expanded = Array.from(bySkin.values()).map(v => ({
      weapon: v.weapon,
      name: v.name,
      wears: Array.from(v.wears.values()),
      image: v.image ?? null
    }));

    const filePath = path.join(cachedDir, `${weapon}.json`);
    await fs.writeFile(filePath, JSON.stringify(expanded, null, 2), "utf-8");
    console.log(`✅ Saved ${expanded.length} skins for ${weapon} → ${filePath}`);
    // Copy to public/skins/
    const publicFilePath = path.join(publicSkinsDir, `${weapon}.json`);
    await fs.writeFile(publicFilePath, JSON.stringify(expanded, null, 2), "utf-8");
    console.log(`📁 Copied ${weapon}.json to public/skins/${weapon}.json`);
    console.log("⏳ Waiting 2s before next weapon...");
    await sleep(2000); // 2 sec pause between weapons to avoid rate limiting
  }

  console.log("🏁 All weapons processed successfully!");

  // Build global skins index automatically after crawl
  try {
    console.log("🔧 Building global skins index...");
    const { execSync } = await import("child_process");
    execSync("npx tsx scripts/scripts/buildSkinsIndex.ts", { stdio: "inherit" });
    console.log("✅ Global skins index built successfully!");
  } catch (err) {
    console.error("⚠️ Failed to build skins index automatically:", err);
  }
}

run().catch(err => {
  console.error("❌ Error in fetchAllSkins:", err);
});