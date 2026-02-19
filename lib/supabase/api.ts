/**
 * Einfacher Supabase-Client für API-Routen.
 * Nutzt createClient direkt (kein Cookie-Management), da API-Routen
 * keine Session-Verwaltung brauchen.
 */
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseApiClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase URL oder Anon Key fehlen.");
  return createClient(url, key);
}
