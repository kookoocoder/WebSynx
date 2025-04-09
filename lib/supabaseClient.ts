import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // In a real app, you might handle this more gracefully
  throw new Error('Missing Supabase environment variables')
}

// Client for use in client-side components and server components/actions (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Optional: Server-side Admin Client ---
// Use this client ONLY in server-side code (.ts files NOT starting with "use client")
// where you explicitly need to bypass RLS (e.g., administrative tasks).
// It's often better to rely on RLS policies and the standard client.
let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Admin client creation skipped.");
    // Return the standard client or null/throw error depending on requirements
    return null; // Or return supabase; if anon key is acceptable fallback
  }

  console.log("Creating Supabase Admin client..."); // Add log for debugging
  supabaseAdminSingleton = createClient(supabaseUrl!, serviceRoleKey!, {
     auth: {
       // Important for server-side operations
       autoRefreshToken: false,
       persistSession: false
     }
  });
  return supabaseAdminSingleton;
} 