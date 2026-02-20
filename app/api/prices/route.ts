import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number | null;
  listingsCount: number | null;
  url: string;
  lastUpdated: string | null;
};

type DbWeapon = { id: string };
type DbSkin = { id: string };
type DbVariant = { id: string };
type DbMarketplace = {
  name: string;
  fees: number | null;
  currency: string | null;
  base_url: string | null;
};
type DbLatestPrice = {
  price: number;
  currency: string;
  listings_count: number | null;
  timestamp: string | null;
};
type DbMarketplaceItem = {
  id: string;
  remote_item_id: string | null;
  marketplaces: DbMarketplace | null;
  latest_prices: DbLatestPrice[];
};

async function fetchSupabasePrices(
  weapon: string,
  skin: string,
  wear: string,
  currency: string
): Promise<PriceRow[]> {
  const supabase = getSupabaseApiClient();

  // 1. Waffe
  const weaponRes = await supabase
    .from("weapons")
    .select("id")
    .eq("name", weapon)
    .maybeSingle();
  const weaponRow = weaponRes.data as DbWeapon | null;
  if (!weaponRow) return [];

  // 2. Skin (DB speichert vollen Marketnamen z.B. "AK-47 | Asiimov")
  const skinRes = await supabase
    .from("skins")
    .select("id")
    .eq("name", `${weapon} | ${skin}`)
    .eq("weapon_id", weaponRow.id)
    .maybeSingle();
  const skinRow = skinRes.data as DbSkin | null;
  if (!skinRow) return [];

  // 3. Variante (Wear) – StatTrak-Varianten (ID endet auf _st) ausschließen
  const variantRes = await supabase
    .from("skin_variants")
    .select("id")
    .eq("skin_id", skinRow.id)
    .eq("wear_name", wear)
    .not("id", "like", "%_st")
    .limit(1)
    .maybeSingle();
  const variantRow = variantRes.data as DbVariant | null;
  if (!variantRow) return [];

  // 4. Marktplatz-Einträge + aktuelle Preise in einem Query
  const itemsRes = await supabase
    .from("marketplace_items")
    .select("id, remote_item_id, marketplaces(name, fees, currency, base_url), latest_prices(price, currency, listings_count, timestamp)")
    .eq("skin_variant_id", variantRow.id);
  const items = (itemsRes.data ?? []) as DbMarketplaceItem[];

  const rows: PriceRow[] = [];

  for (const item of items) {
    const snap = item.latest_prices?.[0];
    const mp = item.marketplaces;
    const fees = mp?.fees != null ? `≈${mp.fees}%` : "—";
    // remote_item_id ist bereits die volle URL zum Angebot
    const url = item.remote_item_id ?? mp?.base_url ?? "#";

    if (!snap) {
      rows.push({
        marketplace: mp?.name ?? "Marktplatz",
        fee: fees,
        currency: currency,
        finalPrice: null,
        listingsCount: null,
        url,
        lastUpdated: null,
      });
      continue;
    }

    const priceCurrency = snap.currency || mp?.currency || currency;
    rows.push({
      marketplace: mp?.name ?? "Marktplatz",
      fee: fees,
      currency: priceCurrency,
      finalPrice: snap.price,
      listingsCount: snap.listings_count ?? null,
      url,
      lastUpdated: snap.timestamp ?? null,
    });
  }

  return rows;
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
          error: "Fehlende oder ungültige Parameter (weapon/skin/wear)",
          required: { weapon: true, skin: true, wear: `eines von: ${WEARS.join(", ")}` },
          received: { weapon: weapon ?? null, skin: skin ?? null, wear: wearParam ?? null },
        },
        { status: 400 }
      );
    }

    const rows = await fetchSupabasePrices(weapon, skin, wear, currency);
    const hasOffers = (r: PriceRow) => r.finalPrice !== null && r.listingsCount !== 0;
    const sorted = [...rows].sort((a, b) => {
      const aHas = hasOffers(a);
      const bHas = hasOffers(b);
      if (!aHas && !bHas) return 0;
      if (!aHas) return 1;
      if (!bHas) return -1;
      return a.finalPrice! - b.finalPrice!;
    });

    if (sorted.length === 0) {
      return NextResponse.json(
        {
          error: "Keine Preise verfügbar",
          query: { weapon, skin, wear, wearLabelDE: WEAR_LABEL_DE[wear], currency },
          rows: [],
        },
        { status: 404, headers: { "Cache-Control": "public, max-age=30" } }
      );
    }

    return NextResponse.json(
      {
        query: { weapon, skin, wear, wearLabelDE: WEAR_LABEL_DE[wear], currency },
        rows: sorted,
        lastUpdated: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
