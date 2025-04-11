"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, PlusCircle, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion as FramerMotion } from "framer-motion";
import ChatHistoryItem from "./chat-history-item";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SidebarProps {
  initiallyExpanded?: boolean;
}

export default function Sidebar({ initiallyExpanded = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [searchQuery, setSearchQuery] = useState("");
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
    console.log("Sidebar: Fetching chat history (placeholder)");
    // Example:
    // const fetchChats = async () => {
    //   const chats = await getMyChatHistory();
    //   setChatHistory(chats);
    // };
    // fetchChats();

    // Placeholder chat data for demonstration
    setChatHistory([
      { id: '1', title: 'Placeholder Chat 1', timestamp: new Date() },
      { id: '2', title: 'Another Placeholder', timestamp: new Date(Date.now() - 86400000) }, // Yesterday
    ]);

  }, []); // Removed supabase dependency

  // Removed loading state check
  // if (loading) {
  //   return <div className="w-64 h-full bg-gray-900 p-4">Loading...</div>; // Or a skeleton loader
  // }

  const filteredHistory = useMemo(() =>
    chatHistory.filter(chat =>
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
    console.log("Sidebar: New Chat button clicked -> Navigating to / and collapsing");
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
        console.log("Focused prompt textarea after navigation");
      } else {
        console.log("Could not find prompt textarea to focus");
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
        if (!isExpanded) {
          setIsExpanded(true); // Expand if collapsed
        } else {
           searchInputRef.current?.focus(); // Focus if already expanded
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
      if (isExpanded && sidebarElement && !sidebarElement.contains(event.target as Node)) {
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
        initial={false}
        animate={{ width: isExpanded ? 256 : 72 }} // Animate width
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full flex-col bg-gradient-to-b from-gray-900 to-black text-white transition-transform duration-300 ease-in-out lg:translate-x-0",
          isExpanded ? "translate-x-0" : "-translate-x-full", // Handle mobile slide-in/out
          "border-r border-purple-700/20"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */} 
          <div className="flex items-center justify-between p-3 border-b border-purple-700/20 h-16">
            {isExpanded && (
              <Link href="/" className="flex items-center gap-2">
                {/* Replace with your actual logo */}
                 <MessageSquare className="h-6 w-6 text-purple-400" /> 
                <span className="text-lg font-semibold">WebSynx</span>
              </Link>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1.5 text-gray-400 hover:bg-purple-700/10 hover:text-white"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* New Chat Button */} 
          <div className="p-2 mt-2">
            <button
              onClick={handleNewChat}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "bg-purple-600 hover:bg-purple-700 text-white",
                !isExpanded && "h-10 w-10 p-0"
              )}
               aria-label="Start new chat"
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search chats... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-purple-700/20 bg-gray-800/50 py-1.5 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}
             {/* Collapsed Search Icon Button */} 
            {!isExpanded && (
              <button
                onClick={handleCollapsedSearchClick}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg h-10 w-10 p-0 text-sm font-medium transition-colors",
                  "text-gray-400 hover:bg-purple-700/10 hover:text-white"
                )}
                 aria-label="Search chats"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          {/* Chat history */} 
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AnimatePresence initial={false}>
              <FramerMotion.div
                key={searchQuery} // Re-run animation on search change if desired
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="px-2 py-1 space-y-1"
              >
                {/* Render history only when expanded */}
                {isExpanded && filteredHistory.length > 0 ? (
                  filteredHistory.map((chat) => (
                    <ChatHistoryItem
                      key={chat.id}
                      chat={chat}
                      isExpanded={isExpanded} // Pass isExpanded state
                      isActive={pathname === `/chats/${chat.id}`}
                    />
                  ))
                ) : isExpanded && searchQuery ? (
                  <div className="px-3 py-2 text-sm text-gray-400 text-center">
                    No chats found
                  </div>
                ) : isExpanded ? (
                   <div className="px-3 py-2 text-sm text-gray-400 text-center">
                    No chat history
                  </div>
                ) : null /* Don't render anything if collapsed */}
              </FramerMotion.div>
            </AnimatePresence>
          </div>

          {/* User profile section (Placeholder/Removed) */} 
          {isExpanded && (
            <div className="border-t border-purple-700/20 p-3 mt-auto">
              {/* Placeholder text or component */}
              <div className="text-xs text-gray-400 text-center py-2">User section</div>
            </div>
          )}
        </div>
      </FramerMotion.aside>
    </>
  );
} 