"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Github, Chrome } from 'lucide-react'; // Assuming you have lucide-react installed

export default function LoginPage() {
  const supabase = createClientComponentClient();

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // You might need to configure redirect URLs in your Supabase project settings
          redirectTo: `${window.location.origin}/auth/callback` // Example redirect URL
        },
      });
      if (error) throw error;
      // Redirect will happen automatically by Supabase
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      // You might want to display a toast notification here
      // Example using your existing toast hook:
      // toast({
      //   title: `Error signing in with ${provider}`,
      //   description: error.message,
      //   variant: "destructive",
      // });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-700/20 bg-gray-800/60 p-8 shadow-lg backdrop-blur-sm">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">Welcome Back</h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Sign in to continue to Llama Coder {/* Or Websynx? */}
        </p>
        <div className="space-y-4">
          <button
            onClick={() => handleOAuthSignIn('google')}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 hover:border-gray-500"
          >
            <Chrome className="h-5 w-5 text-gray-300 transition-colors group-hover:text-white" />
            Sign in with Google
          </button>
          <button
            onClick={() => handleOAuthSignIn('github')}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 hover:border-gray-500"
          >
            <Github className="h-5 w-5 text-gray-300 transition-colors group-hover:text-white" />
            Sign in with GitHub
          </button>
        </div>
        {/* Optional: Add a link back to the home page or other elements */}
        {/* <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-purple-400 hover:underline">
            Go back home
          </Link>
        </div> */}
      </div>
    </div>
  );
}