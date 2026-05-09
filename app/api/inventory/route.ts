import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseApiClient } from "@/lib/supabase/api";
import { parseHashName } from "@/lib/steam-normalize";

export const runtime = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SteamAsset {
  classid: string;
  instanceid: string;
}

interface SteamDescription {
  classid: string;
  instanceid: string;
  market_hash_name: string;
  icon_url: string;
  tradable: number;
  marketable: number;
}

interface SteamInventoryResponse {
  assets?: SteamAsset[];
  descriptions?: SteamDescription[];
  total_inventory_count?: number;
  success?: number;
}

export interface ParsedItem {
  market_hash_name: string;
  weapon: string;
  skin: string;
  wear: string | null;
  stattrak: boolean;
  souvenir: boolean;
  icon_url: string;
  count: number;
}

export interface PricedInventoryItem extends ParsedItem {
  skin_variant_id: string | null;
  steam_price: number | null;
  skincompass_avg: number | null;
  total_steam: number | null;
  total_skincompass: number | null;
}

export interface InventoryResponse {
  items: PricedInventoryItem[];
  total_steam_market: number;
  total_skincompass_avg: number;
  matched_count: number;
  total_count: number;
  cached_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseInventory(data: SteamInventoryResponse): ParsedItem[] {
  // Count copies per classid+instanceid
  const countMap = new Map<string, number>();
  for (const asset of data.assets ?? []) {
    const key = `${asset.classid}_${asset.instanceid}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const items: ParsedItem[] = [];

  for (const desc of data.descriptions ?? []) {
    const key = `${desc.classid}_${desc.instanceid}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Only process marketable items (skins, not stickers/graffiti without market)
    if (!desc.marketable) continue;

    const hashName = desc.market_hash_name ?? "";
    const parsed = parseHashName(hashName);

    items.push({
      market_hash_name: hashName,
      weapon: parsed.weapon ?? "",
      skin: parsed.skin ?? "",
      wear: parsed.wear ?? null,
      stattrak: parsed.variant === "StatTrak",
      souvenir: parsed.variant === "Souvenir",
      icon_url: desc.icon_url ?? "",
      count: countMap.get(key) ?? 1,
    });
  }

  return items;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const steamId = session.user.steamId;
  console.log("[inventory] steamId from session:", steamId);

  // 1. Steam-Inventar laden mit Pagination (max. 75 Items pro Request)
  let invData: SteamInventoryResponse;
  try {
    const PAGE_SIZE = 75;
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://steamcommunity.com/",
    };

    const allAssets: SteamAsset[] = [];
    const allDescriptions: SteamDescription[] = [];
    let lastAssetId: string | undefined;
    let totalCount = 0;
    let pages = 0;
    const MAX_PAGES = 40; // max 3000 Items

    while (pages < MAX_PAGES) {
      const params = new URLSearchParams({ l: "english", count: String(PAGE_SIZE) });
      if (lastAssetId) params.set("start_assetid", lastAssetId);
      const url = `https://steamcommunity.com/inventory/${steamId}/730/2?${params}`;

      const res = await fetch(url, { cache: "no-store", headers: fetchHeaders });

      if (res.status === 403 || res.status === 401) {
        return NextResponse.json(
          { error: "Dein Steam-Inventar ist privat. Bitte stelle es unter Steam → Profil → Privatsphäre auf 'Öffentlich'." },
          { status: 403 }
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[inventory] Steam HTTP ${res.status} page=${pages} steamId=${steamId}:`, body.slice(0, 200));
        if (pages === 0) {
          // First page failed → real error
          return NextResponse.json(
            { error: "Steam-Inventar nicht erreichbar. Bitte stelle sicher, dass dein Inventar öffentlich ist, und versuche es erneut." },
            { status: 503 }
          );
        }
        break; // Partial data — use what we have
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page: any = await res.json();
      if (!page || page === null) break;

      const assets: SteamAsset[] = page.assets ?? [];
      const descriptions: SteamDescription[] = page.descriptions ?? [];
      totalCount = page.total_inventory_count ?? totalCount;

      allAssets.push(...assets);
      // Deduplicate descriptions by classid+instanceid
      for (const d of descriptions) {
        const key = `${d.classid}_${d.instanceid}`;
        if (!allDescriptions.some((x) => `${x.classid}_${x.instanceid}` === key)) {
          allDescriptions.push(d);
        }
      }

      pages++;

      // Check if there are more pages
      if (!page.more_items || assets.length < PAGE_SIZE) break;
      lastAssetId = page.last_assetid;
      if (!lastAssetId) break;

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    invData = {
      assets: allAssets,
      descriptions: allDescriptions,
      total_inventory_count: totalCount,
      success: 1,
    };
  } catch {
    return NextResponse.json(
      { error: "Verbindung zu Steam fehlgeschlagen. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }

  if (!invData.success) {
    return NextResponse.json(
      { error: "Steam hat ein leeres oder ungültiges Inventar zurückgegeben." },
      { status: 404 }
    );
  }

  // 2. Items parsen
  const parsedItems = parseInventory(invData);

  // Nur Items mit vollständigen Skin-Daten (weapon + skin + wear) können gematcht werden
  const matchableItems = parsedItems.filter(
    (i) => i.weapon && i.skin && i.wear
  );

  const supabase = getSupabaseApiClient();

  // 3. Batch-Matching gegen Supabase
  const uniqueSkinNames = [
    ...new Set(matchableItems.map((i) => `${i.weapon} | ${i.skin}`)),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbSkins } = await supabase
    .from("skins")
    .select("id, name")
    .in("name", uniqueSkinNames);

  const skinIdByName = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dbSkins ?? []).map((s: any) => [s.name, s.id])
  );

  const skinIds = [...skinIdByName.values()];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbVariants: any[] = [];
  if (skinIds.length > 0) {
    const { data } = await supabase
      .from("skin_variants")
      .select("id, skin_id, wear_name")
      .in("skin_id", skinIds);
    dbVariants = data ?? [];
  }

  // variantKey: "skinId:wear:stattrak" → variant_id
  const variantKeyMap = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const v of dbVariants) {
    const isStatTrak = String(v.id).endsWith("_st");
    const key = `${v.skin_id}:${v.wear_name}:${isStatTrak}`;
    variantKeyMap.set(key, v.id);
  }

  // market_hash_name → variant_id
  const itemVariantMap = new Map<string, string>();
  const variantIds: string[] = [];

  for (const item of matchableItems) {
    const fullName = `${item.weapon} | ${item.skin}`;
    const skinId = skinIdByName.get(fullName);
    if (!skinId) continue;

    const key = `${skinId}:${item.wear}:${item.stattrak}`;
    const variantId = variantKeyMap.get(key);
    if (!variantId) continue;

    itemVariantMap.set(item.market_hash_name, variantId);
    if (!variantIds.includes(variantId)) variantIds.push(variantId);
  }

  // 4. Preise laden
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mpData: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let priceItems: any[] = [];

  if (variantIds.length > 0) {
    const [mpRes, priceRes] = await Promise.all([
      supabase.from("marketplaces").select("id, name"),
      supabase
        .from("marketplace_items")
        .select(
          "skin_variant_id, marketplace_id, latest_prices(price, currency)"
        )
        .in("skin_variant_id", variantIds),
    ]);
    mpData = mpRes.data ?? [];
    priceItems = priceRes.data ?? [];
  } else {
    const { data } = await supabase.from("marketplaces").select("id, name");
    mpData = data ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mpNameById = new Map<string, string>(mpData.map((m: any) => [m.id, m.name]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steamMpId = mpData.find((m: any) => m.name === "Steam" || m.name === "Steam Market")?.id as string | undefined;

  // variantId → aggregierte Preise
  const pricesByVariant = new Map<
    string,
    { steam: number | null; scPrices: number[] }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pi of priceItems) {
    if (!pricesByVariant.has(pi.skin_variant_id)) {
      pricesByVariant.set(pi.skin_variant_id, { steam: null, scPrices: [] });
    }
    const entry = pricesByVariant.get(pi.skin_variant_id)!;
    const price: number | null = pi.latest_prices?.[0]?.price ?? null;
    if (price === null) continue;

    const mpName = mpNameById.get(pi.marketplace_id);
    if (pi.marketplace_id === steamMpId) {
      entry.steam = price;
    } else if (mpName === "Skinport" || mpName === "Skinbaron") {
      entry.scPrices.push(price);
    }
  }

  // 5. Ergebnisse zusammenbauen
  let totalSteam = 0;
  let totalAvg = 0;
  const matchedNames = new Set<string>();

  const resultItems: PricedInventoryItem[] = parsedItems.map((item) => {
    const variantId = itemVariantMap.get(item.market_hash_name) ?? null;
    const prices = variantId ? pricesByVariant.get(variantId) : null;

    const steamPrice = prices?.steam ?? null;
    const scPrices = prices?.scPrices ?? [];
    const avgPrice =
      scPrices.length > 0
        ? scPrices.reduce((a, b) => a + b, 0) / scPrices.length
        : null;

    const totalItemSteam = steamPrice !== null ? steamPrice * item.count : null;
    const totalItemAvg = avgPrice !== null ? avgPrice * item.count : null;

    if (variantId) matchedNames.add(item.market_hash_name);
    if (totalItemSteam !== null) totalSteam += totalItemSteam;
    if (totalItemAvg !== null) totalAvg += totalItemAvg;

    return {
      ...item,
      skin_variant_id: variantId,
      steam_price: steamPrice,
      skincompass_avg: avgPrice,
      total_steam: totalItemSteam,
      total_skincompass: totalItemAvg,
    };
  });

  // Nach SkinCompass-Gesamtwert sortieren (höchster zuerst), Unbekannte ans Ende
  resultItems.sort((a, b) => {
    const aVal = a.total_skincompass ?? a.total_steam ?? -1;
    const bVal = b.total_skincompass ?? b.total_steam ?? -1;
    return bVal - aVal;
  });

  const response: InventoryResponse = {
    items: resultItems,
    total_steam_market: totalSteam,
    total_skincompass_avg: totalAvg,
    matched_count: matchedNames.size,
    total_count: parsedItems.length,
    cached_at: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "private, max-age=900" },
  });
}
