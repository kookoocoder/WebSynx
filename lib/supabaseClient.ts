import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!(supabaseUrl && supabaseAnonKey)) {
  // In a real app, you might handle this more gracefully
  throw new Error('Missing Supabase environment variables');
}

// Client for use in client-side components and server components/actions (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side Admin Client for administrative operations only
// This should only be used in server components or API routes with the service role key
let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!(supabaseUrl && serviceRoleKey)) {
    throw new Error(
      'Supabase URL or Service Role Key is missing in environment variables.'
    );
  }

  supabaseAdminSingleton = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdminSingleton;
};
