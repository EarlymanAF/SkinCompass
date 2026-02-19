// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { toMarketHashName } from "@/lib/market";
import { getSupabaseServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  trend7d: string;
  priceLabel?: string | null;
  url: string;
};

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

async function fetchSteamPrice(
  origin: string,
  hash: string,
  currency: string
): Promise<VendorSteamResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(
      `${origin}/api/vendors/steam?q=${encodeURIComponent(hash)}&currency=${encodeURIComponent(currency)}`,
      { cache: "no-store", signal: controller.signal }
    );
    if (!res.ok) return null;
    return (await res.json()) as VendorSteamResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Lokale Typen für Supabase-Ergebnisse (verhindert `never`-Inferenz bei
// fehlerhafter database.types.ts-Kodierung)
type DbWeapon = { id: number };
type DbSkin = { id: number };
type DbVariant = { id: number };
type DbMarketplace = { name: string; fees: number | null; currency: string | null; base_url: string | null };
type DbMarketplaceItem = { id: number; marketplaces: DbMarketplace | null };
type DbPriceSnapshot = { price: number; currency: string; timestamp: string };
type DbPriceSnapshotPrice = { price: number };

async function fetchSupabasePrices(
  weapon: string,
  skin: string,
  wear: string,
  currency: string
): Promise<PriceRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await getSupabaseServerClient()) as any;

    // 1. Waffe suchen
    const weaponRes = await supabase.from("weapons").select("id").eq("name", weapon).maybeSingle();
    const weaponRow = weaponRes.data as DbWeapon | null;
    if (!weaponRow) return [];

    // 2. Skin suchen
    const skinRes = await supabase
      .from("skins")
      .select("id")
      .eq("name", skin)
      .eq("weapon_id", weaponRow.id)
      .maybeSingle();
    const skinRow = skinRes.data as DbSkin | null;
    if (!skinRow) return [];

    // 3. Skin-Variante (Wear) suchen
    const variantRes = await supabase
      .from("skin_variants")
      .select("id")
      .eq("skin_id", skinRow.id)
      .eq("wear_tier", wear)
      .maybeSingle();
    const variantRow = variantRes.data as DbVariant | null;
    if (!variantRow) return [];

    // 4. Aktive Marktplatz-Einträge mit Marktplatz-Details
    const itemsRes = await supabase
      .from("marketplace_items")
      .select("id, marketplaces(name, fees, currency, base_url)")
      .eq("skin_variant_id", variantRow.id)
      .eq("active", true);
    const items = (itemsRes.data ?? []) as DbMarketplaceItem[];
    if (items.length === 0) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rows: PriceRow[] = [];

    for (const item of items) {
      // Aktuellster Preissnapshot
      const latestRes = await supabase
        .from("price_snapshots")
        .select("price, currency, timestamp")
        .eq("marketplace_item_id", item.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      const latest = latestRes.data as DbPriceSnapshot | null;
      if (!latest) continue;

      // Preis vor 7 Tagen für Trend-Berechnung
      const weekOldRes = await supabase
        .from("price_snapshots")
        .select("price")
        .eq("marketplace_item_id", item.id)
        .lte("timestamp", sevenDaysAgo.toISOString())
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      const weekOld = weekOldRes.data as DbPriceSnapshotPrice | null;

      const mp = item.marketplaces;
      const fees = mp?.fees != null ? `≈${mp.fees}%` : "—";
      const priceCurrency = latest.currency || mp?.currency || currency;

      let trend7d = "—";
      if (weekOld?.price != null && weekOld.price > 0) {
        const change = ((latest.price - weekOld.price) / weekOld.price) * 100;
        trend7d = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
      }

      rows.push({
        marketplace: mp?.name ?? "Marktplatz",
        fee: fees,
        currency: priceCurrency,
        finalPrice: latest.price,
        trend7d,
        url: mp?.base_url ?? "#",
      });
    }

    return rows;
  } catch {
    return [];
  }
}

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

    const hash = toMarketHashName(weapon, skin, wear);

    const origin = (() => {
      try {
        return new URL(req.url).origin;
      } catch {
        return process.env.NEXT_PUBLIC_BASE_URL || "";
      }
    })();

    // Steam und Supabase parallel abfragen
    const [steamResult, supabaseResult] = await Promise.allSettled([
      fetchSteamPrice(origin, hash, currency),
      fetchSupabasePrices(weapon, skin, wear, currency),
    ]);

    const rows: PriceRow[] = [];

    // Steam-Zeile
    const steam = steamResult.status === "fulfilled" ? steamResult.value : null;
    const steamPrice = steam?.lowest_price ?? steam?.median_price ?? null;
    if (steam && steamPrice != null) {
      const priceLabel =
        steam.lowest_price != null ? steam.lowest_price_text ?? null : steam.median_price_text ?? null;
      rows.push({
        marketplace: "Steam Community Market",
        fee: "≈15%",
        currency: steam.currency,
        finalPrice: steamPrice,
        trend7d: "—",
        priceLabel,
        url: steam.url,
      });
    }

    // Supabase-Zeilen (nur ergänzen, kein Duplikat bei gleichem Marktplatznamen)
    const extraRows = supabaseResult.status === "fulfilled" ? supabaseResult.value : [];
    for (const row of extraRows) {
      if (!rows.some((r) => r.marketplace === row.marketplace)) {
        rows.push(row);
      }
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
