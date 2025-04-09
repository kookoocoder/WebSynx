"use client";

import Providers from "@/app/(main)/providers";
import { Toaster } from "@/components/ui/toaster";
import Spline from '@splinetool/react-spline';
import '@splinetool/runtime';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar';
import { usePathname } from 'next/navigation';
import { DemoControls } from '@/components/demo-controls';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock login state
  const pathname = usePathname();
  
  // For demo purposes, toggle login state
  useEffect(() => {
    // This simulates a logged-in user - in a real app, you'd use auth state
    const userIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(userIsLoggedIn);
    
    // Add a key handler to toggle login state with Ctrl+L
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        setIsLoggedIn(prev => {
          const newState = !prev;
          localStorage.setItem('isLoggedIn', String(newState));
          return newState;
        });
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        
        <div className="relative z-10">
          {children}
        </div>

        <Toaster />
        <DemoControls />
      </body>
    </Providers>
  );
}
