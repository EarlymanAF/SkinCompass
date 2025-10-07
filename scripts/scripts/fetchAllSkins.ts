import fs from "fs";
import path from "path";
import { fetchSteamSkins } from "../../lib/steam";

async function downloadImage(url: string, filepath: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, buffer);
  } catch (err) {
    console.warn(`⚠️ Skipping image ${url}: ${err}`);
  }
}

// Helper: Fetch all pages of skins for a weapon
async function fetchAllPages(weapon: string, maxPages = 20) {
  let allSkins: any[] = [];
  let page = 0;

  while (page < maxPages) {
    console.log(`  → Fetching page ${page + 1} for ${weapon}...`);

    const result = await fetchSteamSkins(weapon);
    if (!result || !result.skins?.length) break;

    allSkins.push(...result.skins);

    if (!result.hasMore || result.skins.length < 100) break;
    page++;
  }

  return allSkins;
}

async function run() {
  const weapons = JSON.parse(fs.readFileSync("data/weapons.json", "utf8"));
  for (const weapon of weapons) {
    console.log(`🔫 Fetching ${weapon}...`);

    const skins = await fetchAllPages(weapon);
    console.log(`→ ${skins.length} total skins fetched for ${weapon}`);

    // Save JSON cache
    const jsonPath = path.join("data/cached", `${weapon}.json`);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(skins, null, 2));

    // Download all images
    let counter = 0;
    for (const skin of skins) {
      if (skin.image) {
        const safeName = skin.name.replace(/[^\w\s-]/g, "_");
        const imgPath = path.join("public/skins", weapon, `${safeName}.jpg`);
        await downloadImage(skin.image, imgPath);
        counter++;
        if (counter % 20 === 0) console.log(`  📸 ${counter} images saved...`);
      }
    }

    console.log(`✅ Done ${weapon} (${skins.length} skins, ${counter} images)`);
  }

  console.log("🎉 All weapons processed successfully!");
}

run().catch((err) => {
  console.error("❌ Error:", err);
});