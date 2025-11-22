import { parseHashName } from "@/lib/steam-normalize";
import { normalizeWeaponToken } from "@/lib/skin-utils";
import { WEARS, type WearEN } from "@/data/wears";

const WEAR_ORDER = new Map(WEARS.map((w, index) => [w, index]));

type AggregatedSkin = {
  weapon: string;
  name: string;
  wears: Set<WearEN>;
  image: string | null;
  stattrak: boolean;
  souvenir: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeSkinName(hashName: string, parsedSkin?: string | null): string | null {
  if (parsedSkin && parsedSkin.trim().length > 0) return parsedSkin.trim();
  const withoutWeapon = hashName.replace(/.*\|\s*/, "");
  return withoutWeapon.replace(/\(.*?\)$/, "").trim() || null;
}

async function crawlWeapon(weapon: string): Promise<Map<string, AggregatedSkin>> {
  const perPage = 100;
  let start = 0;
  let attempt = 0;
  const aggregated = new Map<string, AggregatedSkin>();
  const targetToken = normalizeWeaponToken(weapon);

  while (true) {
    const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=${perPage}&start=${start}&query=${encodeURIComponent(weapon)}`;
    console.log(`🌐 Fetching ${weapon} (page ${start / perPage + 1}) → ${url}`);

    let waitTime = 3000;
    let response: Response;

    while (true) {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SkinCompassBot/1.0; +https://skincompass.de)",
        },
      });

      if (response.status === 429) {
        console.warn(`⚠️ Rate limit hit for ${weapon} page ${start / perPage + 1}. Waiting ${waitTime / 1000}s...`);
        await sleep(waitTime);
        waitTime = Math.min(waitTime * 2, 60000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Steam API request failed for ${weapon} (${response.status})`);
      }
      break;
    }

    const data: any = await response.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) {
      if (attempt === 0) {
        console.warn(`⚠️ No results received for ${weapon}.`);
      }
      break;
    }

    for (const item of results) {
      const hashName = item?.hash_name || item?.name || "";
      if (!hashName) continue;

      const parsed = parseHashName(hashName);
      const detectedWeapon = normalizeWeaponToken(parsed.weapon ?? "");
      if (detectedWeapon && detectedWeapon !== targetToken) {
        // Steam Suche liefert häufig andere Waffen – diese überspringen
        continue;
      }

      const skinName = sanitizeSkinName(hashName, parsed.skin);
      if (!skinName) continue;

      const wear = parsed.wear && WEARS.includes(parsed.wear as WearEN) ? (parsed.wear as WearEN) : null;
      const key = skinName.toLowerCase();
      const iconPath = item?.asset_description?.icon_url_large || item?.asset_description?.icon_url || null;
      const image = iconPath ? `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}` : null;

      const entry =
        aggregated.get(key) ??
        {
          weapon,
          name: skinName,
          wears: new Set<WearEN>(),
          image: image ?? null,
          stattrak: false,
          souvenir: false,
        };

      if (!entry.image && image) {
        entry.image = image;
      }
      if (wear) {
        entry.wears.add(wear);
      }
      if (parsed.variant === "StatTrak") {
        entry.stattrak = true;
      }
      if (parsed.variant === "Souvenir") {
        entry.souvenir = true;
      }

      aggregated.set(key, entry);
    }

    const totalCount = typeof data?.total_count === "number" ? data.total_count : start + results.length;
    start += perPage;
    attempt += 1;

    if (start >= totalCount) {
      break;
    }

    await sleep(1000);
  }

  return aggregated;
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

  for (const weapon of weapons) {
    console.log(`🛠️ Fetching all skins for: ${weapon}`);
    const aggregated = await crawlWeapon(weapon);

    const expanded = Array.from(aggregated.values()).map((v) => {
      const wears = Array.from(v.wears.values()).sort((a, b) => {
        const ai = WEAR_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
        const bi = WEAR_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
        return ai - bi;
      });
      return {
        weapon: v.weapon,
        name: v.name,
        wears: wears.length > 0 ? (wears as WearEN[]) : undefined,
        image: v.image ?? null,
        stattrak: v.stattrak || undefined,
        souvenir: v.souvenir || undefined,
      };
    });

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
