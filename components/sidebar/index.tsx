"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ChatHistoryItem from "./chat-history-item";

interface SidebarProps {
  initiallyExpanded?: boolean;
}

export default function Sidebar({ initiallyExpanded = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  
  // Mock chat history data - in a real app this would come from an API or state
  const [chatHistory, setChatHistory] = useState([
    { id: "1", title: "Landing page for e-commerce", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: "2", title: "Portfolio website with gallery", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: "3", title: "Restaurant menu app", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: "4", title: "Personal blog design", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: "5", title: "Social media dashboard", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
  ]);

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
    <motion.aside
      className="fixed left-0 top-0 z-30 h-full border-r border-purple-700/20 bg-gray-900/70 backdrop-blur-sm"
      initial={{ width: isExpanded ? 250 : 60 }}
      animate={{ width: isExpanded ? 250 : 60 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-purple-700/20">
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden"
              >
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">WS</span>
                  </div>
                  <span className="font-semibold text-gray-200 truncate">WebSynx</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 transition-colors"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
        
        {/* New chat button */}
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2.5 my-2 mx-2 rounded-md bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 text-white font-medium transition-opacity hover:opacity-90 ${
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
              isSearchActive || isExpanded ? "bg-gray-800" : "bg-transparent"
            } transition-colors`}
          >
            <div
              className={`flex items-center ${
                isSearchActive || isExpanded
                  ? "px-3 py-2"
                  : "justify-center py-2 w-full"
              }`}
              onClick={() => {
                if (!isSearchActive) setIsSearchActive(true);
              }}
            >
              <Search
                size={18}
                className="text-gray-400 flex-shrink-0"
              />
            </div>
            
            {(isExpanded || isSearchActive) && (
              <motion.input
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
        </div>
        
        {/* User profile section - stub for now, will connect to user auth later */}
        <div className="mt-auto border-t border-purple-700/20 px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">U</span>
            </div>
            
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col overflow-hidden"
                >
                  <span className="text-sm font-medium text-gray-200 truncate">User Account</span>
                  <span className="text-xs text-gray-400 truncate">Free Plan</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );
} 