'use client';

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
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import ChatHistoryItem from './chat-history-item';

interface SidebarProps {
  initiallyExpanded?: boolean;
}

export default function Sidebar({ initiallyExpanded = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Placeholder for fetching user data or checking auth state
    // if you need user-specific sidebar content.
    // Example:
    // const checkAuth = async () => {
    //   const currentUser = await getMyAuthUser();
    //   setUser(currentUser);
    //   setLoading(false);
    // }
    // checkAuth();

    // For now, assume no user-specific data needed or handle elsewhere
    // setLoading(false);

    // Removed Supabase getSession logic
    // async function fetchUser() {
    //   try {
    //     const { data: { session } } = await supabase.auth.getSession();
    //     if (session?.user) {
    //       setUser(session.user);
    //     }
    //   } catch (error) {
    //     console.error("Error fetching user session in sidebar:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchUser();

    // Placeholder: Fetch chat history from your data source
    console.log('Sidebar: Fetching chat history (placeholder)');
    // Example:
    // const fetchChats = async () => {
    //   const chats = await getMyChatHistory();
    //   setChatHistory(chats);
    // };
    // fetchChats();

    // Placeholder chat data for demonstration
    setChatHistory([
      { id: '1', title: 'Placeholder Chat 1', timestamp: new Date() },
      {
        id: '2',
        title: 'Another Placeholder',
        timestamp: new Date(Date.now() - 86_400_000),
      }, // Yesterday
    ]);
  }, []); // Removed supabase dependency

  // Removed loading state check
  // if (loading) {
  //   return <div className="w-64 h-full bg-gray-900 p-4">Loading...</div>; // Or a skeleton loader
  // }

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
    } else {
      // Respect initial prop or keep current state if manually changed
      // setIsExpanded(initiallyExpanded); // Reverting this to let manual expansion stick
    }

    const handleResize = () => {
      if (isInChatPage && window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]); // Removed initiallyExpanded dependency

  // Focus search input when sidebar expands
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      // Use timeout to ensure input is visible after animation
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 210); // Slightly longer than animation duration
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle new chat creation
  const handleNewChat = () => {
    console.log(
      'Sidebar: New Chat button clicked -> Navigating to / and collapsing'
    );
    // Collapse the sidebar
    setIsExpanded(false);
    // Navigate to the main page to start a new chat
    router.push('/');

    // Add a slight delay to ensure the navigation completes and the component mounts
    setTimeout(() => {
      // Try to find and focus the textarea directly
      const promptTextarea = document.querySelector('textarea[name="prompt"]');
      if (promptTextarea instanceof HTMLTextAreaElement) {
        promptTextarea.focus();
        console.log('Focused prompt textarea after navigation');
      } else {
        console.log('Could not find prompt textarea to focus');
      }
    }, 100);
  };

  // Function to handle clicking the search icon when collapsed
  const handleCollapsedSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Focus will be handled by the useEffect watching isExpanded
    }
  };

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (isExpanded) {
          searchInputRef.current?.focus(); // Focus if already expanded
        } else {
          setIsExpanded(true); // Expand if collapsed
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]); // Added isExpanded dependency

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Find the sidebar element
      const sidebarElement = document.querySelector('aside');

      // If sidebar is expanded and click is outside sidebar
      if (
        isExpanded &&
        sidebarElement &&
        !sidebarElement.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <>
      {/* Overlay for mobile/tablet view when sidebar is open */}
      {!initiallyExpanded && isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <FramerMotion.aside
        animate={{ width: isExpanded ? 256 : 72 }}
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full flex-col bg-gray-800/50 text-white backdrop-blur-sm transition-transform duration-300 ease-in-out lg:translate-x-0',
          isExpanded ? 'translate-x-0' : '-translate-x-full', // Handle mobile slide-in/out
          'border-purple-700/20 border-r'
        )} // Animate width
        initial={false}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-purple-700/20 border-b p-3">
            {isExpanded && (
              <Link className="flex items-center gap-2" href="/">
                {/* Logo */}
                <Image
                  alt="WebSynx Logo"
                  className="h-6 w-6"
                  height={24}
                  src="/websynx-logo.png"
                  width={24}
                />
                <span className="font-semibold text-lg">WebSynx</span>
              </Link>
            )}
            <button
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              className="rounded p-1.5 text-gray-400 hover:bg-purple-700/10 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          {/* New Chat Button */}
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

          {/* Search */}
          <div className="p-2">
            {/* Expanded Search Input */}
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
            {/* Collapsed Search Icon Button */}
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

          {/* Chat history */}
          <div className="scrollbar-hide flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              <FramerMotion.div
                animate={{ opacity: 1, y: 0 }} // Re-run animation on search change if desired
                className="space-y-1 px-2 py-1"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key={searchQuery}
                transition={{ duration: 0.15 }}
              >
                {/* Render history only when expanded */}
                {
                  isExpanded && filteredHistory.length > 0 ? (
                    filteredHistory.map((chat) => (
                      <ChatHistoryItem
                        chat={chat}
                        isActive={pathname === `/chats/${chat.id}`}
                        isExpanded={isExpanded} // Pass isExpanded state
                        key={chat.id}
                      />
                    ))
                  ) : isExpanded && searchQuery ? (
                    <div className="px-3 py-2 text-center text-gray-400 text-sm">
                      No chats found
                    </div>
                  ) : isExpanded ? (
                    <div className="px-3 py-2 text-center text-gray-400 text-sm">
                      No chat history
                    </div>
                  ) : null /* Don't render anything if collapsed */
                }
              </FramerMotion.div>
            </AnimatePresence>
          </div>

          {/* User profile section (Placeholder/Removed) */}
          {isExpanded && (
            <div className="mt-auto border-purple-700/20 border-t p-3">
              {/* Placeholder text or component */}
              <div className="py-2 text-center text-gray-400 text-xs">
                User section
              </div>
            </div>
          )}
        </div>
      </FramerMotion.aside>
    </>
  );
}
