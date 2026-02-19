// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { toMarketHashName } from "@/lib/market";
import { getSupabaseServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

type VendorSteamResponse = {
  success?: boolean;
  market: string;
  currency: string;
  lowest_price_text: string | null;
  median_price_text: string | null;
  volume: string | null;
  lowest_price: number | null;
  median_price: number | null;
  url: string;
  revalidateSeconds: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon")?.trim();
    const skin = searchParams.get("skin")?.trim();
    const wearParam = searchParams.get("wear")?.trim();
    const wear = (wearParam ?? null) as WearEN | null;
    const currency = (searchParams.get("currency") || "EUR").toUpperCase();

    if (!weapon || !skin || !wear || !WEARS.includes(wear)) {
      return NextResponse.json(
        {
          error: "Missing or invalid params (weapon/skin/wear)",
          required: { weapon: true, skin: true, wear: `one of ${WEARS.join(", ")}` },
          received: { weapon: weapon ?? null, skin: skin ?? null, wear: wearParam ?? null },
        },
        { status: 400 }
      );
    }

    // 1) market_hash_name bauen
    // Wir kombinieren weapon, skin und wear sauber zu einem Market-Hash wie bei Steam
    const hash = toMarketHashName(weapon, skin, wear);

    // 2) Steam Vendor (EUR)
    // Upstream call to our vendor adapter with timeout and safe base URL
    const origin = (() => {
      try {
        return new URL(req.url).origin;
      } catch {
        return process.env.NEXT_PUBLIC_BASE_URL || "";
      }
    })();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let steam: VendorSteamResponse | null = null;
    try {
      const resSteam = await fetch(
        `${origin}/api/vendors/steam?q=${encodeURIComponent(hash)}&currency=${encodeURIComponent(currency)}`,
        { cache: "no-store", signal: controller.signal }
      );
      if (resSteam.ok) {
        steam = (await resSteam.json()) as VendorSteamResponse;
      }
    } catch {
      // swallow, we'll fall back to no Steam row
    } finally {
      clearTimeout(timeout);
    }

    // 3) Rows zusammensetzen
    const rows = [];

    const steamPrice = steam?.lowest_price ?? steam?.median_price ?? null;
    const steamData = steam ?? null;

    if (steamData && steamPrice != null) {
      const priceLabel =
        steamData.lowest_price != null
          ? steamData.lowest_price_text ?? null
          : steamData.median_price_text ?? null;
      rows.push({
        marketplace: "Steam Community Market",
        fee: "≈15%",
        currency: steamData.currency,
        finalPrice: steamPrice,             // bereits in gewünschter currency
        trend7d: "—",                       // Steam liefert hier nichts; später ersetzen
        priceLabel,
        url: steamData.url,
      });
    }

    // 4) Skinport-Preis aus Supabase (price_snapshots)
    try {
      const supabase = await getSupabaseServerClient();

      // Schritt 1: marketplace_item + Marktplatz-Metadaten für diesen Hash finden
      const { data: item } = await supabase
        .from("marketplace_items")
        .select("id, marketplaces(name, fees, base_url)")
        .eq("remote_name", hash)
        .eq("active", true)
        .eq("marketplaces.name", "Skinport")
        .limit(1)
        .maybeSingle();

      if (item?.id != null) {
        const mp = Array.isArray(item.marketplaces)
          ? item.marketplaces[0]
          : item.marketplaces;

        // Schritt 2: neuesten Snapshot für dieses Item holen
        const { data: snap } = await supabase
          .from("price_snapshots")
          .select("price, currency")
          .eq("marketplace_item_id", item.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (snap?.price != null) {
          const fees = mp?.fees ?? 0.12;
          const baseUrl = mp?.base_url ?? "https://skinport.com";
          rows.push({
            marketplace: "Skinport",
            fee: `≈${Math.round(fees * 100)}%`,
            currency: snap.currency,
            finalPrice: snap.price,
            trend7d: "—",
            priceLabel: null,
            url: `${baseUrl}/market?search=${encodeURIComponent(hash)}`,
          });
        }
      }
    } catch {
      // swallow – Skinport-Preis ist optional
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "Keine Preise verfügbar",
          query: { weapon, skin, wear, wearLabelDE: WEAR_LABEL_DE[wear], hash, currency },
          rows: [],
          source: { steam: steam ?? null },
          lastUpdated: new Date().toISOString(),
        },
        { status: 404, headers: { "Cache-Control": "public, max-age=30" } }
      );
    }

    return NextResponse.json(
      {
        query: { weapon, skin, wear, wearLabelDE: WEAR_LABEL_DE[wear], hash, currency },
        rows,
        source: { steam: steam ?? null },
        lastUpdated: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
