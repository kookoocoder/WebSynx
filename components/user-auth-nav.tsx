"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import { User } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function UserAuthNav() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      toast({ title: "Logged Out", description: "You have been logged out." });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const isLoggedIn = !!user;

  return (
    <div className="flex items-center gap-2">
      {isLoggedIn ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none dark:hover:bg-zinc-800"
            aria-label="User menu"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.email || "User avatar"} className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />
              )}
            </div>
            <span className="hidden text-sm font-medium md:block text-gray-900 dark:text-white">
              {user?.email || 'Account'}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800 py-1">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || "No email available"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-zinc-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login">
          <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
            Login
          </button>
        </Link>
      )}
    </div>
  );
}