"use client";

import Providers from "@/app/(main)/providers";
import { Toaster } from "@/components/ui/toaster";
import Spline from '@splinetool/react-spline';
import '@splinetool/runtime';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import Sidebar from '@/components/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { DemoControls } from '@/components/demo-controls';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js'; // Import Session type

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
  
  useEffect(() => {
    let isMounted = true; // Track component mount status
    
    // Function to check the session initially
    const checkInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          // If no session found client-side after middleware should have protected, redirect
          if (!initialSession) {
            console.warn("MainLayout: No session found client-side, redirecting to /login.");
            router.push('/login');
          } else {
            setLoading(false); // We have a session, stop loading
          }
        }
      } catch (error) {
        console.error("MainLayout: Error fetching initial session:", error);
        if (isMounted) {
          router.push('/login'); // Redirect on error
        }
      }
    };

    // Listen for auth state changes (e.g., login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setLoading(false); // Auth state confirmed, stop loading
        if (!currentSession) {
          // Redirect to login if user logs out
          router.push('/login');
        }
      }
    });

    // Check the initial session state when the component mounts
    checkInitialSession();

    // Cleanup listener and mount status on unmount
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
    
  }, [supabase, router]);

  const onSplineLoad = () => {
    console.log("Spline loaded successfully");
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

  // If loading is finished but there's still no session, redirect (extra safety)
  if (!session) {
     console.log("MainLayout: Render check - No session, redirecting.");
     // router.push('/login'); // This might be too aggressive, rely on initial check/listener
     return null; // Render nothing while redirect happens
  }

  // Render the main layout content only if loading is false AND session exists
  return (
    <Providers>
      <div className="flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased relative scrollbar-hide">
        <div className="fixed inset-0 z-0">
          {!splineLoaded && (
            <div className="w-full h-full bg-gradient-to-b from-purple-800/5 via-gray-950/90 to-black"></div>
          )}
          <div className="absolute inset-0">
            <div style={{ width: '100%', height: '100vh' }}>
              <Spline
                scene="https://prod.spline.design/BOkXM57f9uxGIpdm/scene.splinecode"
                onLoad={onSplineLoad}
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-800/30 via-black/60 to-black/80 z-[1]"></div>
        </div>
        
        {isSidebarExpanded && <Sidebar initiallyExpanded={isSidebarExpanded} />}
        
        <div className="relative z-10 flex-grow flex flex-col">
          {children}
        </div>

        <Toaster />
        <DemoControls />
      </div>
    </Providers>
  );
}
