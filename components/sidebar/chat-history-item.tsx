'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteChat, renameChat } from '@/app/(main)/actions';

interface ChatHistoryItemProps {
  chat: {
    id: string;
    title: string;
  };
  isExpanded: boolean;
  isActive: boolean;
}

export default function ChatHistoryItem({ chat, isExpanded, isActive }: ChatHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(chat.title || 'Untitled');
  const router = useRouter();

  const onRename = async () => {
    const trimmed = localTitle.trim();
    if (!trimmed || trimmed === chat.title) {
      setIsEditing(false);
      setLocalTitle(chat.title || 'Untitled');
      return;
    }

    // Optimistic UI: emit a custom event so parent list can sync quickly
    window.dispatchEvent(
      new CustomEvent('chat:title:update', { detail: { id: chat.id, title: trimmed } })
    );

    try {
      await renameChat(chat.id, trimmed);
    } finally {
      setIsEditing(false);
    }
  };

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      await deleteChat(chat.id);
    }
  };

  return (
    <Link
      className={`group flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
        isActive
          ? 'border border-purple-500/20 bg-gradient-to-r from-purple-700/20 via-pink-600/15 to-indigo-700/20 text-purple-200 shadow-[0_0_8px_rgba(147,51,234,0.2)]'
          : 'border border-transparent text-gray-300 hover:bg-white/5 hover:text-gray-100 hover:shadow-sm'
      }`}
      href={`/chats/${chat.id}`}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }}
      onMouseEnter={() => router.prefetch(`/chats/${chat.id}`)}
    >
      <div className="flex-shrink-0">
        <MessageSquare
          className={`${isActive ? 'text-purple-400' : 'text-gray-400'} ${
            isActive ? 'drop-shadow-[0_0_2px_rgba(167,139,250,0.5)]' : ''
          }`}
          size={18}
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            animate={{ opacity: 1, width: 'auto' }}
            className="flex min-w-0 flex-1 items-center gap-2"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isEditing ? (
              <input
                autoFocus
                className="w-full rounded bg-gray-800/70 px-2 py-1 text-sm text-gray-200 outline-none ring-1 ring-purple-600/30"
                onBlur={onRename}
                onChange={(e) => setLocalTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRename();
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setLocalTitle(chat.title || 'Untitled');
                  }
                }}
                value={localTitle}
              />
            ) : (
              <span className={`truncate font-medium ${isActive ? 'text-purple-200' : ''}`}>
                {localTitle || 'Untitled'}
              </span>
            )}

            <div className="ml-auto hidden items-center gap-1 group-hover:flex">
              {!isEditing && (
                <button
                  aria-label="Rename chat"
                  className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  title="Rename"
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                aria-label="Delete chat"
                className="rounded p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-300"
                onClick={onDelete}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
