import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();

    // Alle Spalten von skin_variants anzeigen
    const sv = await supabase.from("skin_variants").select("*").limit(3);

    // Alle Spalten von skins anzeigen
    const s = await supabase.from("skins").select("*").limit(2);

    // Alle Spalten von marketplace_items
    const mi = await supabase.from("marketplace_items").select("*").limit(2);

    // Alle Spalten von price_snapshots
    const ps = await supabase.from("price_snapshots").select("*").limit(2);

    return NextResponse.json({
      skin_variants: { data: sv.data, error: sv.error?.message },
      skins: { data: s.data, error: s.error?.message },
      marketplace_items: { data: mi.data, error: mi.error?.message },
      price_snapshots: { data: ps.data, error: ps.error?.message },
    });
  } catch (err) {
    return NextResponse.json({ thrown: err instanceof Error ? err.message : String(err) });
  }
}
