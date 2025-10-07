import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fetchSteamSkins } from "@/lib/steam";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weapon = searchParams.get("weapon");
  const localOnly = searchParams.get("localOnly") === "true";
  const preferLocal = searchParams.get("preferLocal") === "true";

  if (!weapon) {
    return NextResponse.json({ error: "Missing weapon parameter" }, { status: 400 });
  }

  try {
    const cachedPath = path.join(process.cwd(), "data", "cached", `${weapon}.json`);
    const skinsJsonPath = path.join(process.cwd(), "data", "skins.json");

    // 1️⃣ Prüfe, ob Cache vorhanden
    if (fs.existsSync(cachedPath)) {
      const file = fs.readFileSync(cachedPath, "utf8");
      const data = JSON.parse(file);
      return NextResponse.json({ source: "local", weapon, skins: data.skins || [] });
    }

    // 2️⃣ Prüfe, ob data/skins.json vorhanden ist und versuche, passenden Eintrag zu finden
    if (fs.existsSync(skinsJsonPath)) {
      const skinsFile = fs.readFileSync(skinsJsonPath, "utf8");
      const allSkinsData = JSON.parse(skinsFile);
      const weaponData = allSkinsData.find((entry: any) => entry.weapon === weapon);
      if (weaponData) {
        return NextResponse.json({ source: "local", weapon, skins: weaponData.skins || [] });
      }
    }

    // 3️⃣ Wenn localOnly oder preferLocal gesetzt sind und kein lokaler Cache gefunden wurde, return none
    if (localOnly || preferLocal) {
      return NextResponse.json({ source: "none", weapon, skins: [] });
    }

    // 4️⃣ Falls kein Cache → Steam-API abfragen
    console.log(`[SkinCompass] Fetching skins for ${weapon} from Steam...`);
    const skins = await fetchSteamSkins(weapon);

    // 5️⃣ Cache speichern
    fs.mkdirSync(path.dirname(cachedPath), { recursive: true });
    fs.writeFileSync(
      cachedPath,
      JSON.stringify({ weapon, skins }, null, 2),
      "utf8"
    );

    return NextResponse.json({ source: "steam", weapon, skins });
  } catch (err: any) {
    console.error("Error fetching skins:", err);
    return NextResponse.json(
      { error: "Failed to fetch skins", details: err.message },
      { status: 500 }
    );
  }
}
