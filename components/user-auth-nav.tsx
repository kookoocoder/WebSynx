"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

export function UserAuthNav() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user session on component mount
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          // Get profile information
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            profile
          });
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      router.push('/');
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
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

  if (loading) {
    return <div className="w-8 h-8"></div>; // Placeholder during loading
  }

  return (
    <div className="flex items-center gap-2">
      {!user ? (
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-1.5 text-sm text-white shadow-sm transition-all hover:opacity-90 hover:shadow-purple-700/20 hover:shadow"
        >
          Login
        </Link>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-1 rounded-full border border-purple-700/30 bg-gray-800/50 backdrop-blur-[1px] pl-1 pr-3 py-1 text-sm text-gray-200 hover:border-purple-600/50 transition-all hover:shadow-sm"
            aria-expanded={isOpen}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full overflow-hidden">
              {user.profile?.avatar_url ? (
                <Image 
                  width={24}
                  height={24}
                  src={user.profile.avatar_url} 
                  alt={user.profile?.full_name || user.email || 'User Avatar'} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            <span className="ml-1.5 font-medium truncate max-w-[100px]">
              {user.profile?.full_name || user.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-purple-700/20 bg-gray-800/90 py-1.5 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 origin-top-right before:absolute before:-top-1 before:right-3 before:h-2 before:w-2 before:rotate-45 before:rounded-sm before:bg-gray-800/90 before:border-l before:border-t before:border-purple-700/20">
              <div className="px-3 py-2.5 border-b border-purple-700/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden">
                    {user.profile?.avatar_url ? (
                      <Image 
                        width={36}
                        height={36}
                        src={user.profile.avatar_url} 
                        alt={user.profile?.full_name || user.email || 'User Avatar'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium truncate max-w-[180px]">{user.profile?.full_name || 'User'}</p>
                    <p className="text-xs text-purple-300 truncate max-w-[180px]">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-1.5 px-1">
                <button 
                  onClick={handleLogout} 
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