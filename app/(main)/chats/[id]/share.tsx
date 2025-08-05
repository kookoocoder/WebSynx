'use client';

import { useEffect, useRef, useState } from 'react';
import ShareIcon from '@/components/icons/share-icon';
import { toast } from '@/hooks/use-toast';
// Comment out Prisma import
// import { Message } from "@prisma/client";

export function Share({ message }: { message?: any /* Message */ }) {
  const [showPopup, setShowPopup] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const generateShareUrl = () => {
    if (!message) return null;
    const baseUrl = window.location.href;
    const url = new URL(`/share/v2/${message.id}`, baseUrl);
    return url.href;
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = generateShareUrl();
    setShareUrl(url);
    setShowPopup(true);
  };

  const handleCopyClick = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);

    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard',
      variant: 'default',
    });

    setShowPopup(false);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1 rounded border border-purple-700/20 bg-gray-800/50 px-2 py-1 text-gray-200 text-sm transition enabled:hover:border-purple-700/30 enabled:hover:bg-gray-800/70 disabled:opacity-50"
        disabled={!message}
        onClick={handleShareClick}
      >
        <ShareIcon className="h-3 w-3" />
        Share
      </button>

      {showPopup && shareUrl && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowPopup(false)}
          />
          <div
            className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-80 rounded-md border border-gray-700 bg-gray-800/90 p-4 text-gray-200 shadow-lg backdrop-blur-sm"
            ref={popupRef}
          >
            <div className="mb-3 text-center font-medium text-purple-200">
              Share Link
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded bg-gray-900 px-3 py-2 text-xs">
                {shareUrl}
              </div>
              <button
                className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 font-medium text-white text-xs transition hover:bg-purple-700"
                onClick={handleCopyClick}
              >
                Copy
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
