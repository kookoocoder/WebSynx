"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryItemProps {
  chat: {
    id: string;
    title: string;
    timestamp: Date;
  };
  isExpanded: boolean;
  isActive: boolean;
}

export default function ChatHistoryItem({
  chat,
  isExpanded,
  isActive,
}: ChatHistoryItemProps) {
  return (
    <Link
      href={`/chats/${chat.id}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
        isActive
          ? "bg-purple-700/20 text-purple-200"
          : "text-gray-300 hover:bg-gray-800/80 hover:text-gray-100"
      }`}
    >
      <div className="flex-shrink-0">
        <MessageSquare
          size={18}
          className={`${isActive ? "text-purple-400" : "text-gray-400"}`}
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 flex flex-col"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{chat.title}</span>
              <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                {formatDistanceToNow(chat.timestamp, { addSuffix: true })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
} 