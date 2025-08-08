import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getServerSupabase } from '@/lib/supabase-server';

export default async function SharePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  const data = await getMessage(messageId);

  if (!data) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-2xl space-y-6 p-4 text-center">
        <h1 className="text-3xl font-bold">Shared Message</h1>
        <p className="text-gray-600">{data.content}</p>
        <p className="text-gray-400">From chat: {data.chat.title}</p>
      </div>
    </div>
  );
}

const getMessage = cache(async (messageId: string) => {
  const supabase = await getServerSupabase(false);
  const { data, error } = await supabase
    .from('messages')
    .select('content, chats ( title )')
    .eq('id', messageId)
    .single();

  if (error) {
    console.error('Supabase error in getMessage:', error);
    return null;
  }

  if (data && data.chats) {
    const chatData = data.chats as unknown as { title: string };
    return {
      content: data.content,
      chat: {
        title: chatData.title,
      },
    };
  }

  return null;
});
