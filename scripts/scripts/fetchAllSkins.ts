import { SteamSkin } from "@/lib/types";

function buildSteamUrl(weapon: string, skinName: string, wear: string) {
  const cleanName = skinName.replace(/\(.*?\)/, `(${wear})`);
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(cleanName)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSteamSkins(weapon: string, page: number = 0): Promise<{ skins: SteamSkin[]; hasMore: boolean }> {
  const perPage = 100;
  const start = page * perPage;
  const query = encodeURIComponent(`${weapon}`);

  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=${perPage}&start=${start}&query=${query}`;
  console.log(`🌐 Fetching ${weapon} (page ${page}) → ${url}`);

  let waitTime = 10000;

  while (true) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SkinCompassBot/1.0; +https://skincompass.de)"
      }
    });

    if (res.status === 429) {
      console.warn(`⚠️ Rate limit hit for ${weapon} (page ${page}). Waiting ${waitTime / 1000}s...`);
      await sleep(waitTime);
      waitTime = Math.min(waitTime * 2, 60000);
      continue;
    }

    if (!res.ok) throw new Error(`Steam API request failed for ${weapon} (${res.status})`);

    const data = await res.json();
    const results = (data?.results || []).map((item: any) => {
      const skinName = item.hash_name || item.name;
      return {
        name: skinName.replace(/\(.*?\)/, "").trim(),
        image: item.asset_description?.icon_url
          ? `https://steamcommunity-a.akamaihd.net/economy/image/${item.asset_description.icon_url}`
          : null,
        price: item.sell_price_text || null,
        weapon
      };
    });

    const hasMore = data?.total_count > start + results.length;
    console.log(`📄 Page ${page}: fetched ${results.length} skins for ${weapon}`);
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
  const weapons: string[] = JSON.parse(weaponsData);

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

  for (const weapon of weapons) {
    console.log(`🛠️ Fetching all Field-Tested skins for: ${weapon}`);
    let allSkins: SteamSkin[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 50) {
      const { skins, hasMore: more } = await fetchSteamSkins(weapon, page);
      allSkins = allSkins.concat(skins);
      hasMore = more;
      page++;
      await sleep(10000); // 10 sec between pages (verlangsamt wegen Steam-Rate-Limit)
    }

    // Deduplicate by name
    const unique = Array.from(new Map(allSkins.map(s => [s.name, s])).values());

    const expanded = unique;

    const filePath = path.join(cachedDir, `${weapon}.json`);
    await fs.writeFile(filePath, JSON.stringify(expanded, null, 2), "utf-8");
    console.log(`✅ Saved ${expanded.length} skins for ${weapon} → ${filePath}`);
    // Copy to public/skins/
    const publicFilePath = path.join(publicSkinsDir, `${weapon}.json`);
    await fs.writeFile(publicFilePath, JSON.stringify(expanded, null, 2), "utf-8");
    console.log(`📁 Copied ${weapon}.json to public/skins/${weapon}.json`);
    console.log("⏳ Waiting 30s before next weapon...");
    await sleep(30000); // 30 sec pause between weapons to avoid rate limiting
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