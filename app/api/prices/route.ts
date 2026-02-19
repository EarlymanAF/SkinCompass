import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  listingsCount: number | null;
  url: string;
};

type DbWeapon = { id: number };
type DbSkin = { id: number };
type DbVariant = { id: number };
type DbMarketplace = {
  name: string;
  fees: number | null;
  currency: string | null;
  base_url: string | null;
};
type DbMarketplaceItem = {
  id: number;
  remote_item_id: string | null;
  marketplaces: DbMarketplace | null;
};
type DbPriceSnapshot = {
  price: number;
  currency: string;
  listings_count: number | null;
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

  // 2. Skin – DB speichert vollen Marketnamen (z.B. "AK-47 | Asiimov")
  const skinRes = await supabase
    .from("skins")
    .select("id")
    .eq("name", `${weapon} | ${skin}`)
    .eq("weapon_id", weaponRow.id)
    .maybeSingle();
  const skinRow = skinRes.data as DbSkin | null;
  if (!skinRow) return [];

  // 3. Variante (Wear)
  const variantRes = await supabase
    .from("skin_variants")
    .select("id")
    .eq("skin_id", skinRow.id)
    .eq("wear_tier", wear)
    .maybeSingle();
  const variantRow = variantRes.data as DbVariant | null;
  if (!variantRow) return [];

  // 4. Marktplatz-Einträge
  const itemsRes = await supabase
    .from("marketplace_items")
    .select("id, remote_item_id, marketplaces(name, fees, currency, base_url)")
    .eq("skin_variant_id", variantRow.id)
    .eq("active", true);
  const items = (itemsRes.data ?? []) as DbMarketplaceItem[];
  if (items.length === 0) return [];

  const rows: PriceRow[] = [];

  for (const item of items) {
    // Neuester Preis-Snapshot
    const snapRes = await supabase
      .from("price_snapshots")
      .select("price, currency, listings_count")
      .eq("marketplace_item_id", item.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    const snap = snapRes.data as DbPriceSnapshot | null;
    if (!snap) continue;

    const mp = item.marketplaces;
    const fees = mp?.fees != null ? `≈${mp.fees}%` : "—";
    const priceCurrency = snap.currency || mp?.currency || currency;

    // URL: base_url + remote_item_id (falls vorhanden)
    let url = mp?.base_url ?? "#";
    if (mp?.base_url && item.remote_item_id) {
      url = `${mp.base_url.replace(/\/$/, "")}/${item.remote_item_id}`;
    }

    rows.push({
      marketplace: mp?.name ?? "Marktplatz",
      fee: fees,
      currency: priceCurrency,
      finalPrice: snap.price,
      listingsCount: snap.listings_count ?? null,
      url,
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
    const sorted = [...rows].sort((a, b) => a.finalPrice - b.finalPrice);

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
