'use client';

import { useState, useEffect, startTransition } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { removePersonalApiKey, upsertPersonalApiKey } from '@/app/(main)/actions';
import Link from 'next/link';

export default function SettingsPage() {
  const supabase = getBrowserSupabase();
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setError('Please login to manage settings');
        return;
      }
      const { data } = await supabase
        .from('user_secrets')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!mounted) return;
      setHasKey(!!data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      await upsertPersonalApiKey(input);
      setInput('');
      setHasKey(true);
      setSuccess('API key saved.');
    } catch (e: any) {
      setError(e?.message || 'Failed to save key');
    }
  };

  const onRemove = async () => {
    setError(null);
    setSuccess(null);
    try {
      await removePersonalApiKey();
      setHasKey(false);
      setSuccess('API key removed.');
    } catch (e: any) {
      setError(e?.message || 'Failed to remove key');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-300">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6 text-gray-200">
      <div className="mb-4"><Link className="text-purple-400 hover:underline" href="/">← Back</Link></div>
      <h1 className="mb-2 text-xl font-semibold">Settings</h1>
      <p className="mb-6 text-sm text-gray-400">Manage your Together AI API key to unlock unlimited usage.</p>

      {error && <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      {success && <div className="mb-3 rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">{success}</div>}

      {hasKey ? (
        <div className="rounded border border-purple-500/20 bg-gray-900/40 p-4">
          <div className="mb-3 text-sm text-gray-300">Personal API key is configured.</div>
          <button className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700" onClick={onRemove}>
            Remove Key
          </button>
        </div>
      ) : (
        <div className="rounded border border-purple-500/20 bg-gray-900/40 p-4">
          <label className="mb-2 block text-sm">Together API Key</label>
          <input
            className="mb-3 w-full rounded border border-purple-700/30 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            onChange={(e) => setInput(e.target.value)}
            placeholder="tg-..."
            type="password"
            value={input}
          />
          <button className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700" onClick={onSave}>
            Save Key
          </button>
        </div>
      )}
    </div>
  );
}
