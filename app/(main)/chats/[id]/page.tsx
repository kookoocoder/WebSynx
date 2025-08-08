import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
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

  const { data: chatData, error } = await supabase
    .from('chats')
    .select(
      `
      *,
      messages ( * )
    `
    )
    .eq('id', id)
    .order('position', { referencedTable: 'messages', ascending: true })
    .maybeSingle();

  if (error || !chatData) {
    console.error('Supabase error fetching chat:', error);
    notFound();
  }

  const chat = {
    id: chatData.id,
    model: chatData.model,
    quality: chatData.quality,
    prompt: chatData.prompt,
    title: chatData.title,
    llamaCoderVersion: chatData.llamaCoderVersion,
    shadcn: chatData.shadcn,
    created_at: chatData.created_at,
    messages: chatData.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      chat_id: msg.chat_id,
      position: msg.position,
      created_at: msg.created_at,
    })),
  };

  return <PageClient chat={chat} />;
}
