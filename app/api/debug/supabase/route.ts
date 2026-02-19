import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();

    // Alle Tabellen im public Schema finden
    const tables = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name");

    // skin_variants mit korrektem Spaltennamen
    const sv = await supabase.from("skin_variants").select("*").limit(2);

    // marketplaces Tabelle
    const mp = await supabase.from("marketplaces").select("*").limit(5);

    // Preis-Tabellen versuchen
    const lp = await supabase.from("latest_prices").select("*").limit(2);
    const prices = await supabase.from("prices").select("*").limit(2);

    return NextResponse.json({
      all_tables: { data: tables.data, error: tables.error?.message },
      skin_variants_sample: { data: sv.data, error: sv.error?.message },
      marketplaces: { data: mp.data, error: mp.error?.message },
      latest_prices: { data: lp.data, error: lp.error?.message },
      prices: { data: prices.data, error: prices.error?.message },
    });
  } catch (err) {
    return NextResponse.json({ thrown: err instanceof Error ? err.message : String(err) });
  }
}
