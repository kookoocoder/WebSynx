import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import CodeRunner from '@/components/code-runner';
import { supabase } from '@/lib/supabaseClient';
import { extractFirstCodeBlock } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ messageId: string }>;
}): Promise<Metadata> {
  const { messageId } = await params;
  const message = await getMessage(messageId);
  if (!message) {
    notFound();
  }

  const title = message.chat.title;
  const searchParams = new URLSearchParams();
  searchParams.set('prompt', title);

  return {
    title,
    description: `An app generated on LlamaCoder.io: ${title}`,
    openGraph: {
      images: [`/api/og?${searchParams}`],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og?${searchParams}`],
      title,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;

  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select('content')
    .eq('id', messageId)
    .single();

  if (messageError || !messageData) {
    console.error('Supabase error fetching message content:', messageError);
    notFound();
  }

  const app = extractFirstCodeBlock(messageData.content);
  if (!(app && app.language)) {
    console.warn('Could not extract code block from message:', messageId);
    notFound();
  }

  return (
    <div className="fixed inset-0 flex h-full w-full items-center justify-center bg-gray-900">
      <div className="h-full max-h-none w-full max-w-none">
        <CodeRunner code={app.code} language={app.language} />
      </div>
    </div>
  );
}

const getMessage = cache(async (messageId: string) => {
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
