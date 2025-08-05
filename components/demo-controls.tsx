'use client';

import { Command } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    }, 10_000);

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
    <div className="fade-in slide-in-from-bottom-5 fixed right-4 bottom-4 z-50 animate-in rounded-lg border border-purple-700/20 bg-gray-800/90 p-3 text-gray-300 text-xs shadow-lg backdrop-blur-sm duration-300">
      <div className="mb-1.5 flex items-center gap-2">
        <Command className="h-3.5 w-3.5 text-purple-400" />
        <span className="font-medium text-purple-200">Demo Controls</span>
      </div>
      <div className="space-y-1">
        <p>
          <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-[10px] text-gray-200">
            Ctrl
          </kbd>
          {' + '}
          <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-[10px] text-gray-200">
            L
          </kbd>
          {' Toggle login state (currently '}
          <span className={isLoggedIn ? 'text-green-400' : 'text-gray-400'}>
            {isLoggedIn ? 'logged in' : 'logged out'}
          </span>
          {')'}
        </p>
        <p>
          Click the <span className="text-purple-300">Login</span>
          {' button to toggle the sidebar.'}
        </p>
      </div>
    </div>
  );
}
