// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { toMarketHashName } from "@/lib/market";
import fs from "fs";
import path from "path";

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
    } catch (e) {
      // swallow, we'll fall back to no Steam row
    } finally {
      clearTimeout(timeout);
    }

    // 3) Rows zusammensetzen
    const rows = [];

    const steamPrice = steam?.lowest_price ?? steam?.median_price ?? null;

    if (steamPrice != null) {
      const priceLabel =
        steam?.lowest_price != null
          ? steam.lowest_price_text ?? null
          : steam?.median_price_text ?? null;
      rows.push({
        marketplace: "Steam Community Market",
        fee: "≈15%",
        currency: steam.currency,
        finalPrice: steamPrice,             // bereits in gewünschter currency
        trend7d: "—",                       // Steam liefert hier nichts; später ersetzen
        priceLabel,
        url: steam.url,
      });
    }

    // Platzhalter für weitere Märkte:
    // rows.push({ marketplace: "Buff163", fee: "≈2.5%", currency: "EUR", finalPrice: 0, trend7d: "—", url: "#" });
    // rows.push({ marketplace: "CSFloat", fee: "≈5%",   currency: "EUR", finalPrice: 0, trend7d: "—", url: "#" });

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
