"use client";

import ShareIcon from "@/components/icons/share-icon";
import { toast } from "@/hooks/use-toast";
// Comment out Prisma import
// import { Message } from "@prisma/client";

export function Share({ message }: { message?: any /* Message */ }) {
  async function shareAction() {
    if (!message) return;

    const baseUrl = window.location.href;
    const shareUrl = new URL(`/share/v2/${message.id}`, baseUrl);

    toast({
      title: "App Published!",
      description: `App URL copied to clipboard: ${shareUrl.href}`,
      variant: "default",
    });

    await navigator.clipboard.writeText(shareUrl.href);
  }

  return (
    <form action={shareAction} className="flex">
      <button
        type="submit"
        disabled={!message}
        className="inline-flex items-center gap-1 rounded border border-purple-700/20 bg-gray-800/50 px-2 py-1 text-sm text-gray-200 transition enabled:hover:bg-gray-800/70 enabled:hover:border-purple-700/30 disabled:opacity-50"
      >
        <ShareIcon className="h-3 w-3" />
        Share
      </button>
    </form>
  );
}
