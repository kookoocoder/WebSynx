'use client';

import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function CodeViewerLayout({
  children,
  isShowing,
  onClose,
}: {
  children: ReactNode;
  isShowing: boolean;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  return (
    <>
      {isMobile ? (
        <Drawer onClose={onClose} open={isShowing}>
          <DrawerContent>
            <VisuallyHidden.Root>
              <DrawerTitle>Code</DrawerTitle>
              <DrawerDescription>Description</DrawerDescription>
            </VisuallyHidden.Root>

            <div className="scrollbar-hide flex h-[90vh] flex-col overflow-y-scroll">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <div
          className={`${isShowing ? 'w-1/2' : 'w-0'} hidden h-full overflow-hidden py-5 transition-[width] lg:block`}
        >
          <div className="ml-4 flex h-full flex-col rounded-l-xl">
            <div className="flex h-full flex-col rounded-l-xl border-gray-700/50 border-t border-b border-l bg-gray-900/80 backdrop-blur-sm">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
