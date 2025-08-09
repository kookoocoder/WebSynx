import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase(false);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  return <>{children}</>;
}


