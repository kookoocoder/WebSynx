"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Github, Chrome } from 'lucide-react';
import Image from "next/image";

export default function LoginPage() {
  const supabase = createClientComponentClient();

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative">
      {/* Background with gradient */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-b from-purple-800/5 via-gray-950/90 to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-800/30 via-black/60 to-black/80"></div>
      </div>
      
      {/* Logo pill at the top */}
      <div className="relative z-10 mb-8 flex items-center justify-center">
        <div className="bg-gray-800/70 backdrop-blur-sm px-5 py-2 rounded-full border border-purple-700/20 flex items-center gap-2 shadow-lg">
          <Image 
            src="/websynx-logo.png" 
            alt="WebSynx Logo" 
            width={24} 
            height={24} 
            className="rounded-full"
          />
          <span className="text-base font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
            WebSynx
          </span>
        </div>
      </div>
      
      {/* Login container */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-purple-700/20 bg-gray-800/50 p-8 shadow-lg backdrop-blur-md">
        <h1 className="text-center text-2xl font-semibold text-white mb-2">Welcome Back</h1>
        <p className="mb-8 text-center text-sm text-gray-300">
          Sign in to continue to WebSynx
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => handleOAuthSignIn('google')}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-purple-700/20 bg-gray-800/70 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-purple-700/40 hover:bg-gray-800/90 hover:shadow-sm"
          >
            <Chrome className="h-4 w-4 text-gray-300 transition-colors group-hover:text-white" />
            Sign in with Google
          </button>
          
          <button
            onClick={() => handleOAuthSignIn('github')}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-purple-700/20 bg-gray-800/70 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-purple-700/40 hover:bg-gray-800/90 hover:shadow-sm"
          >
            <Github className="h-4 w-4 text-gray-300 transition-colors group-hover:text-white" />
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}