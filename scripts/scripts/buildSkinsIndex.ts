import fs from "fs";
import path from "path";
import { fetchSteamSkins } from "../../lib/steam";
import type { SteamSkin } from "../../lib/types";

const ROOT = path.resolve(__dirname, "..");
const CACHED_DIR = path.join(ROOT, "data", "cached");

async function main() {
  const weapons = ["ak47", "m4a1", "awp"]; // Beispielwaffen, bitte durch echte Liste ersetzen

  for (const weapon of weapons) {
    console.log(`🔫 Fetching ${weapon}...`);
    const { skins } = await fetchSteamSkins(weapon);
    console.log(`→ ${skins.length} total skins fetched for ${weapon}`);
    
    fs.mkdirSync(path.join(CACHED_DIR, weapon), { recursive: true });
    const weaponCache = path.join(CACHED_DIR, `${weapon}.json`);
    fs.writeFileSync(weaponCache, JSON.stringify({ weapon, skins }, null, 2));
    
    console.log(`✅ Done ${weapon} (${skins.length} skins, ${skins.length} images)`);
  }
}

main().catch(console.error);