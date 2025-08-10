'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = getBrowserSupabase();

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          toast({
            title: 'Name required',
            description: 'Please enter your name to create an account.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Store the user's name in user_metadata
            data: { name },
          },
        });

        if (error) throw error;

        if (data?.session) {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at ?? undefined,
            }),
          });
        }

        toast({
          title: 'Signup Successful',
          description: 'Welcome to WebSynx!',
        });

        router.push('/');
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at ?? undefined,
            }),
          });
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });

        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      console.error(isSignup ? 'Signup failed:' : 'Login failed:', error);
      toast({
        title: isSignup ? 'Signup Failed' : 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          {isSignup ? 'Create your account' : 'Login to WebSynx'}
        </h2>

        <form className="space-y-4" onSubmit={handleAuthSubmit}>
          {isSignup && (
            <div>
              <label className="mb-1 block font-medium text-gray-300 text-sm" htmlFor="name">
                Name
              </label>
              <input
                className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
                id="name"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Jane Doe"
                required={isSignup}
                type="text"
                value={name}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block font-medium text-gray-300 text-sm" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
              id="email"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-300 text-sm" htmlFor="password">
              Password
            </label>
            <input
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="w-full rounded-md border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-purple-500 focus:ring-purple-500"
              id="password"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
              <span className="animate-pulse">
                {isSignup ? 'Creating account...' : 'Logging in...'}
              </span>
            ) : (
              isSignup ? 'Sign up' : 'Login'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-purple-300 hover:text-purple-200 hover:underline disabled:opacity-50"
            onClick={() => setIsSignup((v) => !v)}
            disabled={loading}
          >
            {isSignup ? 'Already have an account? Log in' : "Don’t have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
