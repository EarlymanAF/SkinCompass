// app/api/steam/search/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const count = Math.min(parseInt(searchParams.get("count") || "10", 10), 30);

  if (!q) return NextResponse.json({ results: [] });

  const url =
    `https://steamcommunity.com/market/search/render/` +
    `?appid=730&search_descriptions=0&norender=1&count=${count}&start=0&query=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SkinCompass/1.0; +https://skincompass.de)",
      },
    });
    if (!res.ok) return NextResponse.json({ results: [], error: res.status }, { status: res.status });

    const data = await res.json();

    // Jede result-Row enthält `hash_name` + `asset_description.icon_url`
    const results = (data?.results || []).map((r: any) => ({
      name: r?.hash_name as string,
      icon: r?.asset_description?.icon_url ? `https://steamcommunity-a.akamaihd.net/economy/image/${r.asset_description.icon_url}/256x256` : null,
    }));

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ results: [], error: e?.message || "Unexpected error" }, { status: 500 });
  }
}