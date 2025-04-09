"use client";

import { useState, useEffect } from "react";
import { Command } from "lucide-react";

export function DemoControls() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial login state
    const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(storedLoginState);
    
    // Hide after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);
    
    // Update login state when it changes
    const handleStorageChange = () => {
      const updatedLoginState = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(updatedLoginState);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-purple-700/20 bg-gray-800/90 backdrop-blur-sm p-3 text-xs text-gray-300 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2 mb-1.5">
        <Command className="h-3.5 w-3.5 text-purple-400" />
        <span className="font-medium text-purple-200">Demo Controls</span>
      </div>
      <div className="space-y-1">
        <p>
          <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-200 font-mono text-[10px]">Ctrl</kbd>
          {" + "}
          <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-200 font-mono text-[10px]">L</kbd>
          {" Toggle login state (currently "}
          <span className={isLoggedIn ? "text-green-400" : "text-gray-400"}>
            {isLoggedIn ? "logged in" : "logged out"}
          </span>
          {")"}
        </p>
        <p>
          Click the{" "}
          <span className="text-purple-300">Login</span>
          {" button to toggle the sidebar."}
        </p>
      </div>
    </div>
  );
} 