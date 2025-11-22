import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function safeReadJson(filePath: string): any | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const root = process.cwd();
    const weaponsPath = path.join(root, "data", "weapons.json");
    const cachedDir = path.join(root, "data", "cached");

    const weapons: string[] = Array.isArray(safeReadJson(weaponsPath)) ? safeReadJson(weaponsPath) : [];
    const totalWeapons = weapons.length;

    let processedWeapons = 0;
    const perWeapon: Array<{
      weapon: string;
      file: string | null;
      skins: number;
      updatedAt: string | null;
    }> = [];

    let totalSkins = 0;

    for (const weapon of weapons) {
      const file = path.join(cachedDir, `${weapon}.json`);
      if (fs.existsSync(file)) {
        processedWeapons++;
        const stat = fs.statSync(file);
        const data = safeReadJson(file);
        const skinsCount = Array.isArray(data) ? data.length : Array.isArray(data?.skins) ? data.skins.length : 0;
        totalSkins += skinsCount;
        perWeapon.push({
          weapon,
          file: path.relative(root, file),
          skins: skinsCount,
          updatedAt: stat.mtime.toISOString(),
        });
      } else {
        perWeapon.push({ weapon, file: null, skins: 0, updatedAt: null });
      }
    }

    const progress = totalWeapons > 0 ? processedWeapons / totalWeapons : 0;

    return NextResponse.json(
      {
        progress: {
          processedWeapons,
          totalWeapons,
          ratio: Number(progress.toFixed(3)),
          totalSkins,
        },
        perWeapon,
        lastUpdated: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


