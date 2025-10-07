import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const CACHED_DIR = path.join(ROOT, "data", "cached");
const OUTPUT = path.join(ROOT, "data", "skins.json");

function readJson(file: string) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(CACHED_DIR)) {
    console.log("No cached dir found at", CACHED_DIR);
    process.exit(0);
  }

  const files = fs.readdirSync(CACHED_DIR).filter((f) => f.endsWith(".json"));
  const byWeapon: Record<string, string[]> = {};
  const allSet = new Set<string>();

  for (const f of files) {
    const full = path.join(CACHED_DIR, f);
    const json = readJson(full);
    if (!json) continue;

    let weapon = path.basename(f, ".json");
    let skins: string[] = [];
    if (Array.isArray(json)) {
      skins = json.map(String);
    } else if (json && Array.isArray(json.skins)) {
      skins = json.skins.map(String);
      if (json.weapon && typeof json.weapon === "string") weapon = json.weapon;
    }

    const uniq = Array.from(new Set(skins)).sort((a, b) => a.localeCompare(b, "de"));
    byWeapon[weapon] = uniq;
    uniq.forEach((s) => allSet.add(s));
  }

  const all = Array.from(allSet).sort((a, b) => a.localeCompare(b, "de"));
  const out = { generatedAt: new Date().toISOString(), byWeapon, all };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", OUTPUT, "weapons:", Object.keys(byWeapon).length, "totalSkins:", all.length);
}

main();