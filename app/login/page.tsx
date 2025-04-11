"use client";

import React, { useState } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Removed
import { useRouter } from 'next/navigation';
// import { Button } from "@/components/ui/button"; // Commented out due to path issue
// import { Input } from "@/components/ui/input"; // Commented out due to path issue
// import { Label } from "@/components/ui/label"; // Commented out due to path issue
import { toast } from "@/hooks/use-toast";
import { Github, Chrome } from 'lucide-react'; // Keep icons if used for other buttons
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  // const supabase = createClientComponentClient(); // Removed
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Let Supabase handle the error message (including "Email not confirmed")
        throw error;
      }

      // If successful
      toast({ 
        title: "Login Successful",
        description: "Welcome back!"
      });
      
      router.push('/'); 
    } catch (error: any) {
      console.error("Login failed:", error);
      // Display the error message from Supabase or a generic one
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or an unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed handleGitHubLogin and handleGoogleLogin as they relied on Supabase OAuth
  /*
  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("GitHub login error:", error);
      toast({
        title: "GitHub Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
    // No finally setLoading(false) here, as Supabase handles the redirect flow
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        // Optional: Add scopes if needed
        // queryParams: {
        //   access_type: 'offline',
        //   prompt: 'consent',
        // },
      },
    });
    if (error) {
      console.error("Google login error:", error);
      toast({
        title: "Google Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-700/30 bg-gray-800/50 p-8 shadow-2xl shadow-purple-500/10 backdrop-blur-lg">
        <div className="mb-6 flex justify-center">
          <Image 
            src="/websynx-logo.png" 
            alt="WebSynx Logo" 
            width={64} 
            height={64} 
            className="rounded-full h-auto"
            priority
          /> 
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-white">Login to WebSynx</h2>

        {/* Placeholder for OAuth buttons if you implement them with another provider */}
        {/* <div className="mb-6 grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleGitHubLogin} disabled={loading} className="w-full flex items-center justify-center gap-2 border-gray-600 hover:bg-gray-700/50 text-white">
            <Github className="h-5 w-5" />
            GitHub
          </Button>
          <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-2 border-gray-600 hover:bg-gray-700/50 text-white">
            <Chrome className="h-5 w-5" />
            Google
          </Button>
        </div>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="mx-4 flex-shrink text-xs uppercase text-gray-400">Or continue with</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div> */} 

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">Password</label>
             <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
               <span className="animate-pulse">Logging in...</span>
             ) : (
               'Login'
             )}
          </button>
        </form>

        {/* Placeholder for Sign Up Link */}
        {/* <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <a href="/signup" className="font-medium text-purple-400 hover:text-purple-300">
            Sign up
          </a>
        </p> */} 
      </div>
    </div>
  );
}