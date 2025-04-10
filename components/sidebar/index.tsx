"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion as FramerMotion } from "framer-motion";
import ChatHistoryItem from "./chat-history-item";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from "next/image";

interface SidebarProps {
  initiallyExpanded?: boolean;
}

export default function Sidebar({ initiallyExpanded = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  // Fetch user data and chat history
  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsLoading(false);
          return;
        }
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser({
            ...session.user,
            profile,
          });
        }
        
        // Fetch user's chats
        const { data: chats, error } = await supabase
          .from('chats')
          .select('id, title, created_at')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (chats) {
          setChatHistory(chats.map(chat => ({
            id: chat.id,
            title: chat.title || 'Untitled Chat',
            timestamp: new Date(chat.created_at),
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
    
    // Subscribe to changes in the chats table
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
      }, () => {
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-collapse sidebar on chat pages if window is smaller than medium breakpoint
  useEffect(() => {
    const isInChatPage = pathname.includes('/chats/');
    const isMediumScreen = window.innerWidth < 1024; // lg breakpoint
    
    if (isInChatPage && isMediumScreen) {
      setIsExpanded(false);
    } else {
      setIsExpanded(initiallyExpanded);
    }
    
    const handleResize = () => {
      if (isInChatPage && window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname, initiallyExpanded]);

  // Focus the search input when it becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSearchActive &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node) &&
        searchQuery === ""
      ) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchActive, searchQuery]);

  return (
    <FramerMotion.aside
      className="fixed left-0 top-0 z-30 h-full bg-black/35 backdrop-blur-xl border-r border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] overflow-hidden"
      initial={{ width: isExpanded ? 250 : 60, x: 0 }}
      animate={{ width: isExpanded ? 250 : 60, x: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-purple-700/20">
          <AnimatePresence initial={false}>
            {isExpanded && (
              <FramerMotion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden"
              >
                <Link href="/" className="flex items-center gap-2">
                  <Image 
                    src="/websynx-logo.png" 
                    alt="WebSynx Logo" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                  />
                  <span className="font-semibold text-gray-200 truncate">WebSynx</span>
                </Link>
              </FramerMotion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
        
        {/* New chat button */}
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2.5 my-2 mx-2 rounded-md bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 text-white font-medium transition-all hover:opacity-90 hover:shadow-[0_0_10px_rgba(147,51,234,0.3)] ${
            !isExpanded ? "justify-center" : ""
          }`}
        >
          <Plus size={18} />
          {isExpanded && <span>New Chat</span>}
        </Link>
        
        {/* Search bar */}
        <div className="px-2 py-2 relative">
          <div
            className={`relative flex items-center rounded-md ${
              isSearchActive || isExpanded ? "bg-white/5 backdrop-blur-md border border-white/5" : "bg-transparent"
            } transition-all`}
          >
            <div
              className={`flex items-center ${
                isSearchActive || isExpanded
                  ? "px-3 py-2"
                  : "justify-center py-2 w-full"
              }`}
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true);
                  // Wait for the sidebar to expand before focusing the input
                  setTimeout(() => {
                    setIsSearchActive(true);
                    searchInputRef.current?.focus();
                  }, 200); // Match the transition duration
                } else if (!isSearchActive) {
                  setIsSearchActive(true);
                }
              }}
            >
              <Search
                size={18}
                className="text-gray-400 flex-shrink-0"
              />
            </div>
            
            {(isExpanded || isSearchActive) && (
              <FramerMotion.input
                ref={searchInputRef}
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none border-none text-gray-200 text-sm py-1 placeholder-gray-400"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </div>
        </div>
        
        {/* Chat history */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="px-2 py-1 space-y-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((chat) => (
                  <ChatHistoryItem
                    key={chat.id}
                    chat={chat}
                    isExpanded={isExpanded}
                    isActive={pathname === `/chats/${chat.id}`}
                  />
                ))
              ) : searchQuery ? (
                <div className="px-3 py-2 text-sm text-gray-400 text-center">
                  No chats found
                </div>
              ) : null}
            </div>
          )}
        </div>
        
      </div>
    </FramerMotion.aside>
  );
} 