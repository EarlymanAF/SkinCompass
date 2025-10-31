import weapons from "@/data/weapons.json";
import fs from "fs";

async function verifyWeapon(weapon: string) {
  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=5&query=${encodeURIComponent(weapon)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const hasResults = (data?.results?.length || 0) > 0;
    console.log(`${hasResults ? "✅" : "⚠️"} ${weapon} → ${hasResults ? data.results.length + " results" : "no skins found"}`);
    return { weapon, ok: hasResults };
  } catch (err) {
    console.error(`❌ Error for ${weapon}:`, err);
    return { weapon, ok: false };
  }
}

async function run() {
  console.log("🔍 Verifying available weapons on Steam Market...");
  const results = [];
  for (const weapon of weapons) {
    const result = await verifyWeapon(weapon);
    results.push(result);
    await new Promise(r => setTimeout(r, 1500)); // avoid rate limit
  }

  const missing = results.filter(r => !r.ok).map(r => r.weapon);
  fs.writeFileSync("data/missingWeapons.json", JSON.stringify(missing, null, 2));
  console.log(`\n✅ Verification done. Missing weapons saved to data/missingWeapons.json`);
}

run();
