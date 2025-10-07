import fs from "fs";
import path from "path";
import type { SteamSkin } from "../../lib/types";

interface CachedWeaponData {
  skins?: SteamSkin[];
}

async function main() {
  const cachedDir = path.join(process.cwd(), "data", "cached");
  const outputPath = path.join(process.cwd(), "data", "skins.json");

  const allWeapons = fs.readdirSync(cachedDir).filter(f => f.endsWith(".json"));
  const flatSkins: { weapon: string; name: string }[] = [];
  const skipped: string[] = [];

  for (const weaponFile of allWeapons) {
    const weaponName = weaponFile.replace(".json", "");
    const filePath = path.join(cachedDir, weaponFile);

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as CachedWeaponData | SteamSkin[];

      const skins = Array.isArray(data)
        ? data // direktes Array
        : Array.isArray(data.skins)
        ? data.skins // Objekt mit "skins"
        : null;

      if (!skins) {
        skipped.push(weaponName);
        console.warn(`⚠️ Skipped ${weaponName}: no valid skins array.`);
        continue;
      }

      for (const skin of skins) {
        if (skin && skin.name) {
          flatSkins.push({ weapon: weaponName, name: skin.name });
        }
      }
    } catch (err) {
      skipped.push(weaponName);
      console.error(`❌ Failed to read ${weaponName}:`, err);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(flatSkins, null, 2));

  console.log(`✅ Wrote ${outputPath} with ${flatSkins.length} skins across ${allWeapons.length} weapons.`);
  if (skipped.length > 0) {
    console.warn(`⚠️ Skipped ${skipped.length} weapons: ${skipped.join(", ")}`);
  }
}

main().catch(err => {
  console.error("❌ Error building skins index:", err);
  process.exit(1);
});