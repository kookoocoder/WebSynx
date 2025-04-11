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
// The admin client is typically used for operations requiring elevated privileges, often related to authentication bypass or user management on the backend.
// Since we are removing Supabase auth, this specialized client setup is likely unnecessary.
// If backend operations still need direct database access with elevated rights, consider a different approach or ensure the service_role key usage is strictly for non-auth purposes.

// let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

// export const getSupabaseAdmin = () => {
//   if (supabaseAdminSingleton) {
//     return supabaseAdminSingleton;
//   }

//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!supabaseUrl || !serviceRoleKey) {
//     throw new Error('Supabase URL or Service Role Key is missing in environment variables.');
//   }

//   supabaseAdminSingleton = createClient(supabaseUrl!, serviceRoleKey!, {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//       detectSessionInUrl: false,
//     }
//   });

//   return supabaseAdminSingleton;
// }; 