import fs from "fs";
import path from "path";

type SourceSkin = {
  name?: string;
  collection?: string;
  origin?: string;
};

type MappingEntry = {
  skin: string;
  case: string | null;
  collection: string | null;
};

function loadSource(): Record<string, SourceSkin> {
  const file = path.join(process.cwd(), "external", "items_game_cdn.json");
  const raw = fs.readFileSync(file, "utf-8");
  const json = JSON.parse(raw);

  if (!json?.skins || typeof json.skins !== "object") {
    throw new Error("Unexpected items_game_cdn.json format – missing skins map");
  }

  return json.skins as Record<string, SourceSkin>;
}

function buildMapping(): MappingEntry[] {
  const skins = loadSource();
  const entries: MappingEntry[] = [];

  for (const skinId of Object.keys(skins)) {
    const source = skins[skinId];
    if (!source?.name) continue;

    entries.push({
      skin: source.name,
      case: source.origin ?? null,
      collection: source.collection ?? null,
    });
  }

  return entries;
}

function main() {
  const outputPath = path.join(process.cwd(), "data", "cases.json");
  const mapping = buildMapping();
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  console.log(`✅ Wrote ${mapping.length} entries to ${outputPath}`);
}

main();
