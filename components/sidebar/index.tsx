"use client";

import { AnimatePresence, motion as FramerMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PlusCircle,
  Search,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import ChatHistoryItem from './chat-history-item';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  user_id?: string;
}

interface SidebarProps {
  initiallyExpanded?: boolean;
}

export default function Sidebar({ initiallyExpanded = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const supabase = getBrowserSupabase();

  // Function to fetch user session and chat history
  const fetchUserAndChats = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch chat history
      let query = supabase
        .from('chats')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false });

      // If user is logged in, only fetch their chats
      if (currentUser) {
        query = query.eq('user_id', currentUser.id);
      } else {
        // If no user, fetch chats without user_id (anonymous chats)
        query = query.is('user_id', null);
      }

      const { data: chats, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]);
      } else {
        setChatHistory(chats || []);
      }
    } catch (error) {
      console.error('Error in fetchUserAndChats:', error);
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch user session and chat history
  useEffect(() => {
    fetchUserAndChats();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        await fetchUserAndChats();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserAndChats, supabase]);

  // Refresh chat history when pathname changes (new chat created)
  useEffect(() => {
    if (pathname.includes('/chats/')) {
      const timer = setTimeout(() => {
        fetchUserAndChats();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, fetchUserAndChats]);

  const filteredHistory = useMemo(
    () =>
      chatHistory.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chatHistory, searchQuery]
  );

  // Auto-collapse sidebar on chat pages if window is smaller than medium breakpoint
  useEffect(() => {
    const isInChatPage = pathname.includes('/chats/');
    const isMediumScreen = window.innerWidth < 1024; // lg breakpoint

    if (isInChatPage && isMediumScreen) {
      setIsExpanded(false);
    }

    const handleResize = () => {
      if (isInChatPage && window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);

  // Focus search input when sidebar expands
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 210);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle new chat creation
  const handleNewChat = () => {
    setIsExpanded(false);
    router.push('/');
    setTimeout(() => {
      const promptTextarea = document.querySelector('textarea[name="prompt"]');
      if (promptTextarea instanceof HTMLTextAreaElement) {
        promptTextarea.focus();
      }
    }, 100);
  };

  // Function to handle clicking the search icon when collapsed
  const handleCollapsedSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (isExpanded) {
          searchInputRef.current?.focus();
        } else {
          setIsExpanded(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebarElement = document.querySelector('aside');
      if (isExpanded && sidebarElement && !sidebarElement.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <>
      {!initiallyExpanded && isExpanded && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsExpanded(false)} />
      )}

      <FramerMotion.aside
        animate={{ width: isExpanded ? 256 : 72 }}
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full flex-col bg-gray-800/50 text-white backdrop-blur-sm transition-transform duration-300 ease-in-out lg:translate-x-0',
          isExpanded ? 'translate-x-0' : '-translate-x-full',
          'border-purple-700/20 border-r'
        )}
        initial={false}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-purple-700/20 border-b p-3">
            {isExpanded && (
              <Link className="flex items-center gap-2" href="/">
                <Image alt="WebSynx Logo" className="h-6 w-6" height={24} src="/websynx-logo.png" width={24} />
                <span className="font-semibold text-lg">WebSynx</span>
              </Link>
            )}
            <button
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              className="rounded p-1.5 text-gray-400 hover:bg-purple-700/10 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          <div className="mt-2 p-2">
            <button
              aria-label="Start new chat"
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-sm transition-colors',
                'bg-purple-600 text-white hover:bg-purple-700',
                !isExpanded && 'h-10 w-10 p-0'
              )}
              onClick={handleNewChat}
            >
              <PlusCircle size={isExpanded ? 20 : 24} />
              {isExpanded && <span>New Chat</span>}
            </button>
          </div>

          <div className="p-2">
            {isExpanded && (
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
                <input
                  className="w-full rounded-lg border border-purple-700/20 bg-gray-800/50 py-1.5 pr-3 pl-9 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats... (⌘K)"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                />
              </div>
            )}
            {!isExpanded && (
              <button
                aria-label="Search chats"
                className={cn(
                  'flex h-10 w-10 w-full items-center justify-center rounded-lg p-0 font-medium text-sm transition-colors',
                  'text-gray-400 hover:bg-purple-700/10 hover:text-white'
                )}
                onClick={handleCollapsedSearchClick}
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <div className="scrollbar-hide flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              <FramerMotion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1 px-2 py-1"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key={searchQuery}
                transition={{ duration: 0.15 }}
              >
                {loading && isExpanded && (
                  <div className="px-3 py-2 text-center text-gray-400 text-sm">Loading chats...</div>
                )}

                {!loading && isExpanded && filteredHistory.length > 0 ? (
                  filteredHistory.map((chat) => (
                    <ChatHistoryItem
                      chat={{ id: chat.id, title: chat.title, timestamp: new Date(chat.created_at) }}
                      isActive={pathname === `/chats/${chat.id}`}
                      isExpanded={isExpanded}
                      key={chat.id}
                    />
                  ))
                ) : !loading && isExpanded && searchQuery ? (
                  <div className="px-3 py-2 text-center text-gray-400 text-sm">No chats found</div>
                ) : !loading && isExpanded ? (
                  <div className="px-3 py-2 text-center text-gray-400 text-sm">No chat history</div>
                ) : null}
              </FramerMotion.div>
            </AnimatePresence>
          </div>

          {isExpanded && (
            <div className="mt-auto border-purple-700/20 border-t p-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-gray-200">{user.email}</div>
                    <div className="text-xs text-gray-400">{chatHistory.length} chats</div>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-gray-400 text-xs">Anonymous user</div>
              )}
            </div>
          )}
        </div>
      </FramerMotion.aside>
    </>
  );
}
