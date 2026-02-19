import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();

    // latest_prices Schema + Beispieldaten
    const lp = await supabase.from("latest_prices").select("*").limit(3);

    // marketplace_items mit latest_prices Join testen
    const mi = await supabase
      .from("marketplace_items")
      .select("id, skin_variant_id, remote_item_id, latest_prices(*)")
      .limit(2);

    return NextResponse.json({
      latest_prices: { data: lp.data, error: lp.error?.message },
      marketplace_items_with_prices: { data: mi.data, error: mi.error?.message },
    });
  } catch (err) {
    return NextResponse.json({ thrown: err instanceof Error ? err.message : String(err) });
  }
}
