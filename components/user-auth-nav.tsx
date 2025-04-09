"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";

export function UserAuthNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load login state from localStorage
  useEffect(() => {
    const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(storedLoginState);
    
    // Add event listener to update login state when changed elsewhere
    const handleStorageChange = () => {
      const updatedLoginState = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(updatedLoginState);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Toggle login status
  const toggleLogin = () => {
    const newState = !isLoggedIn;
    localStorage.setItem('isLoggedIn', String(newState));
    setIsLoggedIn(newState);
    
    // Dispatch storage event for other components to pick up the change
    window.dispatchEvent(new Event('storage'));
  };

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {!isLoggedIn ? (
        <button
          onClick={toggleLogin}
          className="rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-1.5 text-sm text-white shadow-sm transition-all hover:opacity-90 hover:shadow-purple-700/20 hover:shadow"
        >
          Login
        </button>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-1 rounded-full border border-purple-700/30 bg-gray-800/50 backdrop-blur-[1px] pl-1 pr-3 py-1 text-sm text-gray-200 hover:border-purple-600/50 transition-all hover:shadow-sm"
            aria-expanded={isOpen}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 shadow-sm">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="ml-1.5 font-medium">User</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-purple-700/20 bg-gray-800/90 py-1.5 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 origin-top-right before:absolute before:-top-1 before:right-3 before:h-2 before:w-2 before:rotate-45 before:rounded-sm before:bg-gray-800/90 before:border-l before:border-t before:border-purple-700/20">
              <div className="px-3 py-2.5 border-b border-purple-700/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">user@example.com</p>
                    <p className="text-xs text-purple-300">Free Account</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-1.5 px-1">
                <button className="group flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-purple-700/10 rounded-lg mx-auto my-0.5 hover:text-purple-200 transition-colors duration-150">
                  <Settings className="h-4 w-4 text-purple-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span>Settings</span>
                </button>
                <div className="my-1 px-2">
                  <div className="border-t border-purple-700/10"></div>
                </div>
                <button 
                  onClick={toggleLogin} 
                  className="group flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-purple-700/10 rounded-lg mx-auto my-0.5 hover:text-purple-200 transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4 text-purple-400 group-hover:translate-x-0.5 transition-transform duration-200" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 