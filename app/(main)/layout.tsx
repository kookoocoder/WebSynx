'use client';

import Spline from '@splinetool/react-spline';
import Providers from '@/app/(main)/providers';
import { Toaster } from '@/components/ui/toaster';
import '@splinetool/runtime';
import type { Session } from '@supabase/supabase-js'; // Import Session type
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { getBrowserSupabase } from '@/lib/supabase-browser';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading

  const supabase = getBrowserSupabase();

  useEffect(() => {
    let isMounted = true; // Track component mount status

    // Function to check the session initially
    const checkInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(initialSession);
        if (initialSession) {
          setLoading(false);
        } else {
          setLoading(false); // Ensure we stop loading even if redirecting
          router.push('/login');
        }
      } catch (error) {
        console.error('MainLayout: Error fetching initial session:', error);
        if (isMounted) {
          setLoading(false);
          router.push('/login'); // Redirect on error
        }
      }
    };

    // Listen for auth state changes (e.g., login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setLoading(false); // Auth state confirmed, stop loading
      if (!currentSession) {
        router.push('/login');
      }
    });

    // Check the initial session state when the component mounts
    void checkInitialSession();

    // Cleanup listener and mount status on unmount
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  const onSplineLoad = () => {
    console.log('Spline loaded successfully');
    setSplineLoaded(true);
  };

  // Determine if we should show the sidebar initially expanded or collapsed
  const isInChatPage = pathname.includes('/chats/');
  const initiallyExpanded = !isInChatPage;

  // Show loading indicator until the session state is confirmed client-side
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading application...
      </div>
    );
  }

  // If loading is finished but there's still no session, rely on redirect
  if (!session) {
    return null;
  }

  // Render the main layout content only if loading is false AND session exists
  return (
    <Providers>
      <div className="scrollbar-hide relative flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased">
        <div className="fixed inset-0 z-0">
          {!splineLoaded && (
            <div className="h-full w-full bg-gradient-to-b from-purple-800/5 via-gray-950/90 to-black" />
          )}
          {/*<div className="absolute inset-0">
            <div style={{ width: '100%', height: '100vh' }}>
              <Spline
                onLoad={onSplineLoad}
                scene="https://prod.spline.design/BOkXM57f9uxGIpdm/scene.splinecode"
              />
            </div>
          </div>*/}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-purple-800/30 via-black/60 to-black/80" />
        </div>

        {isSidebarExpanded && <Sidebar initiallyExpanded={isSidebarExpanded} />}

        <div className="relative z-10 flex flex-grow flex-col">{children}</div>

        <Toaster />
      </div>
    </Providers>
  );
}
