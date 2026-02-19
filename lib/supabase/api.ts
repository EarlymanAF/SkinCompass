/**
 * Einfacher Supabase-Client für API-Routen.
 * Nutzt createClient direkt (kein Cookie-Management), da API-Routen
 * keine Session-Verwaltung brauchen.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL oder Anon Key fehlen.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseApiClient(): any {
  return createClient(supabaseUrl!, supabaseAnonKey!);
}
