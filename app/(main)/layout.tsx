"use client";

import Providers from "@/app/(main)/providers";
import { Toaster } from "@/components/ui/toaster";
import Spline from '@splinetool/react-spline';
import '@splinetool/runtime';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import Sidebar from '@/components/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { DemoControls } from '@/components/demo-controls';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client
// import { Session } from '@supabase/supabase-js'; // Removed Session type import

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // const supabase = useMemo(() => createClientComponentClient(), []); // Removed Supabase client initialization
  const [loading, setLoading] = useState(true); // Keep loading state for potential alternative auth check
  
  useEffect(() => {
    // Placeholder for alternative authentication check
    const checkAuthentication = async () => {
      console.log("MainLayout: Checking authentication (placeholder)");
      // Replace this with your actual authentication logic
      // e.g., check for a token, call your auth API
      const isAuthenticated = false; // Simulate logged out state for now

      if (!isAuthenticated) {
        console.log("MainLayout: User not authenticated, redirecting to /login (placeholder)");
        // router.push('/login'); // Uncomment to redirect if not authenticated
        setLoading(false); // Stop loading after check
      } else {
        console.log("MainLayout: User authenticated (placeholder)");
        // Optionally fetch user data here if needed for the layout
        setLoading(false); // Stop loading after check
      }
    };

    checkAuthentication();

    // --- Removed Supabase Auth Logic ---
    // const getSessionData = async () => {
    //   try {
    //     const { data: { session } } = await supabase.auth.getSession();
    //     setSession(session);
    //     if (!session) {
    //       router.push('/login');
    //     }
    //   } catch (error) {
    //     console.error("Error fetching session:", error);
    //     router.push('/login'); // Redirect on error
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // getSessionData();
    //
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    //   if (!session) {
    //     router.push('/login');
    //   }
    // });
    //
    // return () => {
    //   subscription?.unsubscribe();
    // };
     // --- End of Removed Supabase Auth Logic ---

  }, [router]); // Removed supabase from dependencies

  const onSplineLoad = () => {
    console.log("Spline loaded successfully");
    setSplineLoaded(true);
  };
  
  // Determine if we should show the sidebar initially expanded or collapsed
  const isInChatPage = pathname.includes('/chats/');
  const initiallyExpanded = !isInChatPage;

  if (loading) {
    // Optional: Render a loading spinner or skeleton screen
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading application...
      </div>
    );
  }

  // Removed check: If no session, don't render layout (handled by redirect placeholder)
  // if (!session) {
  //   return null; // Or a redirect component
  // }

  return (
    <Providers>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased relative scrollbar-hide">
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
      </body>
    </Providers>
  );
}
