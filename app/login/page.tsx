'use client';

import { Chrome, Github } from 'lucide-react'; // Keep icons if used for other buttons
import Image from 'next/image';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Removed
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
// import { Button } from "@/components/ui/button"; // Commented out due to path issue
// import { Input } from "@/components/ui/input"; // Commented out due to path issue
// import { Label } from "@/components/ui/label"; // Commented out due to path issue
import { toast } from '@/hooks/use-toast';
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
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      router.push('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      // Display the error message from Supabase or a generic one
      toast({
        title: 'Login Failed',
        description:
          error.message ||
          'Invalid credentials or an unexpected error occurred.',
        variant: 'destructive',
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
            alt="WebSynx Logo"
            className="h-auto rounded-full"
            height={64}
            priority
            src="/websynx-logo.png"
            width={64}
          />
        </div>
        <h2 className="mb-6 text-center font-bold text-2xl text-white">
          Login to WebSynx
        </h2>

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

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          <div>
            <label
              className="mb-1 block font-medium text-gray-300 text-sm"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
              id="email"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label
              className="mb-1 block font-medium text-gray-300 text-sm"
              htmlFor="password"
            >
              Password
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
              id="password"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
              type="password"
              value={password}
            />
          </div>
          <button
            className="w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
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
