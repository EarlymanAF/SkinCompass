import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(nicht gesetzt)";
  const keyRaw = process.env.SUPABASE_SECRET_KEY ?? "";
  const keyHint = keyRaw
    ? `${keyRaw.slice(0, 12)}...${keyRaw.slice(-4)} (${keyRaw.length} Zeichen)`
    : "(nicht gesetzt)";

  try {
    const supabase = getSupabaseApiClient();

    const weaponsRes = await supabase.from("weapons").select("id, name").limit(5);
    const skinsRes = await supabase.from("skins").select("id, name").limit(5);

    return NextResponse.json({
      url,
      key: keyHint,
      weapons: {
        data: weaponsRes.data,
        error: weaponsRes.error ? { message: weaponsRes.error.message, code: weaponsRes.error.code } : null,
      },
      skins: {
        data: skinsRes.data,
        error: skinsRes.error ? { message: skinsRes.error.message, code: skinsRes.error.code } : null,
      },
    });
  } catch (err) {
    return NextResponse.json({
      url,
      key: keyHint,
      thrown: err instanceof Error ? err.message : String(err),
    });
  }
}
