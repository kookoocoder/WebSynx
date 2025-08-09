'use client';

import type { User } from '@supabase/supabase-js';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export function UserAuthNav() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getBrowserSupabase();
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/set-session', { method: 'DELETE' });
      setIsOpen(false);
      toast({ title: 'Logged Out', description: 'You have been logged out.' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const isLoggedIn = !!user;

  return (
    <div className="flex items-center gap-2">
      {isLoggedIn ? (
        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="User menu"
            className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none dark:hover:bg-zinc-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
              {user?.user_metadata?.avatar_url ? (
                <img
                  alt={user.email || 'User avatar'}
                  className="h-full w-full rounded-full object-cover"
                  src={user.user_metadata.avatar_url}
                />
              ) : (
                <UserIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />
              )}
            </div>
            <span className="hidden font-medium text-gray-900 text-sm md:block dark:text-white">
              {user?.email || 'Account'}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800">
              <div className="border-gray-200 border-b px-3 py-2 dark:border-zinc-700">
                <p className="font-medium text-gray-900 text-sm dark:text-white">
                  Account
                </p>
                <p className="text-gray-500 text-xs dark:text-gray-400">
                  {user?.email || 'No email available'}
                </p>
              </div>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 text-sm hover:bg-gray-100 dark:text-red-400 dark:hover:bg-zinc-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
            Login
          </button>
        </Link>
      )}
    </div>
  );
}
