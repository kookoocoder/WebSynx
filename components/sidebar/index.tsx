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

  const fetchUserAndChats = useCallback(async () => {
    try {
      // do not clear UI; keep previous list for smoother UX
      setLoading(chatHistory.length === 0);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      let query = supabase
        .from('chats')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false });

      if (!currentUser) {
        // If not signed in, no chats should be fetched (route is server-gated anyway)
        setChatHistory([]);
        setLoading(false);
        return;
      }

      query = query.eq('user_id', currentUser.id);

      const { data: chats, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]);
      } else if (chats) {
        setChatHistory(chats);
      }
    } catch (error) {
      console.error('Error in fetchUserAndChats:', error);
      if (chatHistory.length === 0) setChatHistory([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, chatHistory.length]);

  // Initial fetch and auth change handling
  useEffect(() => {
    fetchUserAndChats();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await fetchUserAndChats();
    });
    return () => subscription.unsubscribe();
  }, [fetchUserAndChats, supabase]);

  // Realtime updates: keep list fresh without reloading on navigation
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      channel = supabase
        .channel('realtime:chats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats',
            // no filter needed; we will filter client-side if user exists
          },
          (payload) => {
            setChatHistory((prev) => {
              const rowAny = (payload.new ?? payload.old) as Partial<Chat> | null | undefined;
              if (!rowAny || !rowAny.id) return prev;

              // For signed-in users, only react to their chats
              if (user?.id && rowAny.user_id && rowAny.user_id !== user.id) {
                return prev;
              }

              if (payload.eventType === 'INSERT') {
                const next = [rowAny as Chat, ...prev.filter((c) => c.id !== rowAny.id!)];
                return next.sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              }
              if (payload.eventType === 'UPDATE') {
                const next = prev.map((c) => (c.id === rowAny.id ? (rowAny as Chat) : c));
                return next.sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              }
              if (payload.eventType === 'DELETE') {
                return prev.filter((c) => c.id !== rowAny.id);
              }
              return prev;
            });
          }
        )
        .subscribe();
    };

    void setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  // Optimistic title sync from item-level events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; title: string }>).detail;
      if (!detail) return;
      setChatHistory((prev) => prev.map((c) => (c.id === detail.id ? { ...c, title: detail.title } : c)));
    };
    window.addEventListener('chat:title:update' as any, handler);
    return () => window.removeEventListener('chat:title:update' as any, handler);
  }, []);

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
    if (isInChatPage && isMediumScreen) setIsExpanded(false);
    const handleResize = () => {
      if (isInChatPage && window.innerWidth < 1024) setIsExpanded(false);
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

  const handleCollapsedSearchClick = () => {
    if (!isExpanded) setIsExpanded(true);
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
          {/* header */}
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

          {/* search and new chat */}
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

          {/* list */}
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
                {loading && chatHistory.length === 0 && isExpanded && (
                  <div className="px-3 py-2 text-center text-gray-400 text-sm">Loading chats...</div>
                )}

                {!loading && isExpanded && filteredHistory.length > 0 ? (
                    filteredHistory.map((chat) => (
                      <ChatHistoryItem
                      chat={{ id: chat.id, title: chat.title }}
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

          {/* footer */}
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
              ) : null}
            </div>
          )}
        </div>
      </FramerMotion.aside>
    </>
  );
}
