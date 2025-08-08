import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getServerSupabase(modifyCookies: boolean = false) {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (modifyCookies) {
          store.set({ name, value, ...options });
        }
      },
      remove(name: string, options: CookieOptions) {
        if (modifyCookies) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        }
      },
    },
  });
}

let adminClient: ReturnType<typeof createClient> | null = null;
export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}
