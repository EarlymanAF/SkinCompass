import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

// Aufruf: /api/debug?weapon=AK-47&skin=Redline&wear=Minimal%20Wear
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weapon = searchParams.get("weapon") ?? "AK-47";
  const skin = searchParams.get("skin") ?? "Redline";
  const wear = searchParams.get("wear") ?? "Minimal Wear";

  const supabase = getSupabaseApiClient();

  const w = await supabase.from("weapons").select("id").eq("name", weapon).maybeSingle();
  const weaponId = w.data?.id ?? null;

  const s = weaponId
    ? await supabase.from("skins").select("id, name").eq("name", `${weapon} | ${skin}`).eq("weapon_id", weaponId).maybeSingle()
    : null;
  const skinId = s?.data?.id ?? null;

  const sv = skinId
    ? await supabase.from("skin_variants").select("id, wear_name").eq("skin_id", skinId)
    : null;
  const variantMatch = sv?.data?.find((v: { wear_name: string }) => v.wear_name === wear) ?? null;
  const variantId = variantMatch?.id ?? null;

  const mi = variantId
    ? await supabase
        .from("marketplace_items")
        .select("id, active, remote_item_id, latest_prices(price, currency, listings_count)")
        .eq("skin_variant_id", variantId)
    : null;

  return NextResponse.json({
    query: { weapon, skin, wear },
    step1_weapon: { id: weaponId, error: w.error?.message },
    step2_skin: { id: skinId, name: s?.data?.name, error: s?.error?.message },
    step3_variants: { all: sv?.data, matched_wear: variantMatch, error: sv?.error?.message },
    step4_items: { data: mi?.data, error: mi?.error?.message },
  });
}
