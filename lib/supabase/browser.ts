import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL oder Anon Key fehlen (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}

type TypedDatabase = Database["public"];

let browserClient: SupabaseClient<TypedDatabase> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient<TypedDatabase>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
