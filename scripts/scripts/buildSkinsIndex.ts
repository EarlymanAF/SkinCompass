import fs from "fs";
import path from "path";
import type { SteamSkin } from "../../lib/types";

type CaseMappingEntry = {
  skin: string;
  case?: string | null;
  collection?: string | null;
};

interface CachedWeaponData {
  skins?: SteamSkin[];
}

function loadCaseMapping(): Map<string, CaseMappingEntry> {
  const filePath = path.join(process.cwd(), "data", "cases.json");

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ cases.json nicht gefunden – Case/Collection bleiben leer.");
    return new Map();
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as CaseMappingEntry[];

    return new Map(
      parsed
        .filter(entry => entry?.skin)
        .map(entry => [entry.skin.toLowerCase(), entry] as const)
    );
  } catch (err) {
    console.warn("⚠️ Konnte cases.json nicht lesen – Case/Collection bleiben leer.", err);
    return new Map();
  }
}

async function main() {
  const cachedDir = path.join(process.cwd(), "data", "cached");
  const outputPath = path.join(process.cwd(), "data", "skins.json");
  const caseMap = loadCaseMapping();

  const allWeapons = fs.readdirSync(cachedDir).filter(f => f.endsWith(".json"));
  const flatSkins: {
    weapon: string;
    name: string;
    wears?: string[];
    image?: string | null;
    stattrak?: boolean;
    souvenir?: boolean;
    case?: string | null;
    collection?: string | null;
  }[] = [];
  const skipped: string[] = [];

  for (const weaponFile of allWeapons) {
    const weaponName = weaponFile.replace(".json", "");
    const filePath = path.join(cachedDir, weaponFile);

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as CachedWeaponData | SteamSkin[];

      const skins = Array.isArray(data)
        ? data // direktes Array
        : Array.isArray((data as any).skins)
        ? (data as any).skins // Objekt mit "skins"
        : null;

      if (!skins) {
        skipped.push(weaponName);
        console.warn(`⚠️ Skipped ${weaponName}: no valid skins array.`);
        continue;
      }

      for (const skin of skins as any[]) {
        if (skin && skin.name) {
          const mapping = caseMap.get(String(skin.name).toLowerCase());

          flatSkins.push({
            weapon: weaponName,
            name: skin.name,
            wears: (skin.wears ?? undefined) as string[] | undefined,
            image: skin.image ?? undefined,
            stattrak: skin.stattrak ?? undefined,
            souvenir: skin.souvenir ?? undefined,
            case: mapping?.case ?? null,
            collection: mapping?.collection ?? null,
          });
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
