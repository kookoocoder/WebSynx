'use client';

import Providers from '@/app/(main)/providers';
import { Toaster } from '@/components/ui/toaster';
import Sidebar from '@/components/sidebar';
import '@splinetool/runtime';
import Spline from '@splinetool/react-spline';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export default function MainClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [splineLoaded, setSplineLoaded] = useState(false);

  const isInChatPage = useMemo(() => pathname.includes('/chats/'), [pathname]);
  const isSidebarExpanded = !isInChatPage;

  return (
    <Providers>
      <div className="scrollbar-hide relative flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased">
        <div className="fixed inset-0 z-0">
          {!splineLoaded && (
            <div className="h-full w-full bg-gradient-to-b from-purple-800/5 via-gray-950/90 to-black" />
          )}
          <div className="absolute inset-0">
            <div style={{ width: '100%', height: '100vh' }}>
              <Spline
                onLoad={() => setSplineLoaded(true)}
                scene="https://prod.spline.design/BOkXM57f9uxGIpdm/scene.splinecode"
              />
            </div>
          </div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-purple-800/30 via-black/60 to-black/80" />
        </div>

        {isSidebarExpanded && <Sidebar initiallyExpanded={isSidebarExpanded} />}

        <div className="relative z-10 flex flex-grow flex-col">{children}</div>

        <Toaster />
      </div>
    </Providers>
  );
}


