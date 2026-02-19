import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();

    // Test 1: Erste Waffe holen
    const w = await supabase.from("weapons").select("id, name").limit(1).maybeSingle();

    // Test 2: Skins ohne Join
    const s1 = await supabase.from("skins").select("id, name").limit(3);

    // Test 3: Skins mit image_url
    const s2 = await supabase.from("skins").select("id, name, image_url").limit(3);

    // Test 4: Skins mit skin_variants Join
    const s3 = await supabase.from("skins").select("id, name, skin_variants(wear_tier)").limit(3);

    // Test 5: Skins mit weapon_id Filter (nutzt erste Waffe aus Test 1)
    const weaponId = w.data?.id;
    const s4 = weaponId
      ? await supabase
          .from("skins")
          .select("id, name, image_url, skin_variants(wear_tier)")
          .eq("weapon_id", weaponId)
          .limit(3)
      : null;

    return NextResponse.json({
      weapon: { data: w.data, error: w.error?.message },
      skins_basic: { data: s1.data, error: s1.error?.message },
      skins_with_image: { data: s2.data, error: s2.error?.message },
      skins_with_variants: { data: s3.data, error: s3.error?.message },
      skins_by_weapon: s4
        ? { data: s4.data, error: s4.error?.message }
        : { skipped: "no weapon found" },
    });
  } catch (err) {
    return NextResponse.json({ thrown: err instanceof Error ? err.message : String(err) });
  }
}
