// app/api/steam/icon/route.ts
import { NextResponse } from "next/server";

const STEAM_LISTING_BASE =
  "https://steamcommunity.com/market/listings/730"; // 730 = CS2/CSGO AppID
const ECONOMY_IMAGE_BASE =
  "https://steamcommunity-a.akamaihd.net/economy/image"; // + /<ICON_URL>/<SIZE>

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name"); // market_hash_name
  const size = searchParams.get("size") || "512x512"; // optional

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' (market_hash_name) query param." },
      { status: 400 }
    );
  }

  // Render-Endpoint liefert JSON mit `assets`, darin icon_url/icon_url_large
  const url =
    `${STEAM_LISTING_BASE}/${encodeURIComponent(name)}/render` +
    `?start=0&count=1&currency=3&language=english&format=json`;

  try {
    const res = await fetch(url, {
      // Caching bewusst kurz halten, Bilder ändern sich selten – Listings öfter
      next: { revalidate: 60 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SkinCompass/1.0; +https://skincompass.de)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Steam response ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // In `assets` steckt ein verschachteltes Objekt: appid -> contextid -> assetId -> { icon_url, ... }
    const assets = data?.assets?.["730"]?.["2"]; // 2 = CS:GO/CS2 Inventar-Kontext
    let iconUrl: string | undefined;

    if (assets && typeof assets === "object") {
      for (const key of Object.keys(assets)) {
        const asset = assets[key];
        iconUrl = asset?.icon_url_large || asset?.icon_url;
        if (iconUrl) break;
      }
    }

    if (!iconUrl) {
      return NextResponse.json(
        { error: "icon_url not found in Steam response." },
        { status: 404 }
      );
    }

    const finalImage = `${ECONOMY_IMAGE_BASE}/${iconUrl}/${size}`;
    // Variante A: Direkt JSON zurück
    // return NextResponse.json({ image: finalImage });

    // Variante B: 302 Redirect direkt aufs Bild (praktisch, um <img src="/api/..."> zu nutzen)
    return NextResponse.redirect(finalImage, { status: 302 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}