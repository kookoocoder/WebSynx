'use client';

import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

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
      className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
        isActive
          ? 'border border-purple-500/20 bg-gradient-to-r from-purple-700/20 via-pink-600/15 to-indigo-700/20 text-purple-200 shadow-[0_0_8px_rgba(147,51,234,0.2)]'
          : 'border border-transparent text-gray-300 hover:bg-white/5 hover:text-gray-100 hover:shadow-sm'
      }`}
      href={`/chats/${chat.id}`}
    >
      <div className="flex-shrink-0">
        <MessageSquare
          className={`${isActive ? 'text-purple-400' : 'text-gray-400'} ${isActive ? 'drop-shadow-[0_0_2px_rgba(167,139,250,0.5)]' : ''}`}
          size={18}
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            animate={{ opacity: 1, width: 'auto' }}
            className="flex min-w-0 flex-1 flex-col"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <span
                className={`truncate font-medium ${isActive ? 'text-purple-200' : ''}`}
              >
                {chat.title}
              </span>
              <span className="ml-2 flex-shrink-0 text-gray-400 text-xs">
                {formatDistanceToNow(chat.timestamp, { addSuffix: true })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
