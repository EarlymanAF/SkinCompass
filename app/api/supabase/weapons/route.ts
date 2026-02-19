import { NextResponse } from "next/server";
import { getSupabaseApiClient } from "@/lib/supabase/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();
    const res = await supabase.from("weapons").select("name, category").order("name");
    const rows = (res.data ?? []) as { name: string; category: string | null }[];
    const names = rows.map((r) => r.name);
    return NextResponse.json(names, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
