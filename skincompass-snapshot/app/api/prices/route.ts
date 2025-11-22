// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { toMarketHashName } from "@/lib/market";

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

    if (!weapon || !skin || !wear || !WEARS.includes(wear)) {
      return NextResponse.json(
        { error: "Missing or invalid params (weapon/skin/wear)" },
        { status: 400 }
      );
    }

    // 1) market_hash_name bauen
    const hash = toMarketHashName(weapon, skin, wear);

    // 2) Steam Vendor (EUR)
    const resSteam = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/vendors/steam?q=${encodeURIComponent(hash)}&currency=EUR`,
      { cache: "no-store" }
    );
    const steam = (await resSteam.json()) as VendorSteamResponse;

    // 3) Rows zusammensetzen
    const rows = [];

    if (steam?.lowest_price != null) {
      rows.push({
        marketplace: "Steam Community Market",
        fee: "≈15%",
        currency: steam.currency,
        finalPrice: steam.lowest_price,      // bereits EUR
        trend7d: "—",                       // Steam gibt hier nichts; später ersetzen
        url: steam.url,
      });
    }

    // Platzhalter für weitere Märkte:
    // rows.push({ marketplace: "Buff163", fee: "≈2.5%", currency: "EUR", finalPrice: 0, trend7d: "—", url: "#" });
    // rows.push({ marketplace: "CSFloat", fee: "≈5%",   currency: "EUR", finalPrice: 0, trend7d: "—", url: "#" });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Keine Preise verfügbar", query: { weapon, skin, wear, hash } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      query: { weapon, skin, wear, wearLabelDE: WEAR_LABEL_DE[wear], hash },
      rows,
      source: { steam: steam ?? null },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}