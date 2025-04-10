"use client";

import Providers from "@/app/(main)/providers";
import { Toaster } from "@/components/ui/toaster";
import Spline from '@splinetool/react-spline';
import '@splinetool/runtime';
import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/sidebar';
import { usePathname } from 'next/navigation';
import { DemoControls } from '@/components/demo-controls';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track Supabase auth status
  const pathname = usePathname();
  // Memoize the Supabase client instance to prevent it from changing on re-renders
  const supabase = useMemo(() => createClientComponentClient(), []);
  
  // Check Supabase auth state on mount and listen for changes
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setIsLoggedIn(!!session); // Set logged in status based on session existence
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsLoggedIn(!!session); // Update logged in status on auth changes
      }
    });

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]); // Dependency array now uses the stable memoized client

  const onSplineLoad = () => {
    console.log("Spline loaded successfully");
    setSplineLoaded(true);
  };
  
  // Determine if we should show the sidebar initially expanded or collapsed
  const isInChatPage = pathname.includes('/chats/');
  const initiallyExpanded = !isInChatPage;

  return (
    <Providers>
      <body className="flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased relative scrollbar-hide">
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
        
        {isLoggedIn && <Sidebar initiallyExpanded={initiallyExpanded} />}
        
        <div className="relative z-10 flex-grow flex flex-col">
          {children}
        </div>

        <Toaster />
        <DemoControls />
      </body>
    </Providers>
  );
}
