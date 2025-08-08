import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import PageClient from './page.client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 45;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const supabase = await getServerSupabase(false);

  // Fetch chat metadata first (lets RLS fail fast if not owner)
  const { data: chatRow, error: chatError } = await supabase
    .from('chats')
    .select('id, model, prompt, title, shadcn, created_at')
    .eq('id', id)
    .single();

  if (chatError || !chatRow) {
    console.error('Failed to load chat row', { id, chatError });
    notFound();
  }

  // Fetch messages separately
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, role, content, chat_id, position, created_at')
    .eq('chat_id', id)
    .order('position', { ascending: true });

  if (messagesError) {
    console.error('Failed to load chat messages', { id, messagesError });
    notFound();
  }

  const chat = {
    id: chatRow.id,
    model: chatRow.model,
    prompt: chatRow.prompt,
    title: chatRow.title,
    shadcn: chatRow.shadcn,
    created_at: chatRow.created_at,
    messages: (messages ?? []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      chat_id: msg.chat_id,
      position: msg.position,
      created_at: msg.created_at,
    })),
  } as const;

  return <PageClient chat={chat} />;
}
