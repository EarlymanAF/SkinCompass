/**
 * Einfacher Supabase-Client für API-Routen.
 * Nutzt createClient direkt (kein Cookie-Management), da API-Routen
 * keine Session-Verwaltung brauchen.
 */
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseApiClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Server-only Secret Key (kein NEXT_PUBLIC_ – nie im Browser exponieren)
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SECRET_KEY fehlen.");
  return createClient(url, key);
}
