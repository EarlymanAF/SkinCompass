// app/api/steam/search/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Roh-Typ (so ähnlich liefert es Steam; wir tippen defensiv)
type SteamSearchRaw = {
  results?: Array<{
    name?: string;
    hash_name?: string;
    sell_listings?: number;
    sell_price_text?: string;
    app_icon?: string;
  }>;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ error: "Missing query param 'q'" }, { status: 400 });
    }

    // TODO: Hier später echten Steam-Endpoint aufrufen.
    // Platzhalter, damit der Build ohne 'any' sauber durchläuft:
    // const res = await fetch(steamUrl, { headers: {...} });
    // const json: unknown = await res.json();
    const json: unknown = { results: [] };

    // Defensiv parsen (ohne any):
    const raw = json as SteamSearchRaw;

    const items =
      Array.isArray(raw.results)
        ? raw.results
            .filter((r): r is NonNullable<SteamSearchRaw["results"]>[number] => !!r)
            .map((r) => ({
              name: r.name ?? "",
              hash_name: r.hash_name ?? "",
              price_text: r.sell_price_text ?? "",
              icon: r.app_icon ?? "",
            }))
        : [];

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}