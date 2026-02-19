import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Nutzt SUPABASE_SECRET_KEY (server-only), Fallback auf alten Anon Key
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SECRET_KEY fehlen.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({ name, value, ...(options || {}) });
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set({ name, value: "", ...(options || {}), maxAge: 0 });
      },
    },
  }) as ReturnType<typeof createServerClient<Database>>;
}
