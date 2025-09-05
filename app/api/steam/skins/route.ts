// app/api/steam/skins/route.ts
export const runtime = "nodejs"; // wichtig, damit Node-Fetch & CORS serverseitig laufen

import { NextResponse } from "next/server";

/**
 * Liefert eine Liste von Skinnamen für eine gegebene Waffe,
 * basierend auf der Steam Community Market Suche.
 *
 * Query: ?weapon=AK-47
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon")?.trim();

    if (!weapon) {
      return NextResponse.json({ error: "weapon fehlt" }, { status: 400 });
    }

    // Steam Market Search (serverseitig, kein CORS-Problem)
    // Wir suchen nach "<Waffe> | " und holen bis zu 200 Ergebnisse.
    const url = new URL("https://steamcommunity.com/market/search/render/");
    url.searchParams.set("appid", "730");
    url.searchParams.set("norender", "1");
    url.searchParams.set("count", "200");
    url.searchParams.set("query", `${weapon} | `);

    const res = await fetch(url.toString(), {
      headers: {
        // konservativer UA, hilft gegen 403
        "User-Agent":
          "Mozilla/5.0 (compatible; SkinCompassBot/1.0; +https://skincompass.de)",
        "Accept": "application/json,text/javascript,*/*;q=0.1",
      },
      // Steam lässt i. d. R. GET ohne Referer zu
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Steam antwortete ${res.status}` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as {
      success: boolean;
      total_count: number;
      results?: Array<{ hash_name: string }>;
    };

    if (!json.success || !json.results) {
      return NextResponse.json({ skins: [] }, { status: 200 });
    }

    // hash_name Beispiel: "AK-47 | Redline (Field-Tested)"
    // Wir extrahieren den Teil zwischen "Waffe | " und " (Wear)"
    const prefix = `${weapon} | `;
    const set = new Set<string>();

    for (const r of json.results) {
      const name = r.hash_name;
      if (!name.startsWith(prefix)) continue;

      const after = name.slice(prefix.length); // "Redline (Field-Tested)"
      const idx = after.lastIndexOf(" ("); // vor Wear
      const skin = idx > 0 ? after.slice(0, idx) : after;

      // filtern z. B. "★", "Sticker", Cases etc., nur echte Weapon-Skins
      if (skin.includes("Sticker") || skin.includes("Case")) continue;
      // optional weitere Filter, falls nötig

      set.add(skin.trim());
    }

    const skins = Array.from(set).sort((a, b) =>
      a.localeCompare(b, "de", { sensitivity: "base" })
    );

    return NextResponse.json({ weapon, skins });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}