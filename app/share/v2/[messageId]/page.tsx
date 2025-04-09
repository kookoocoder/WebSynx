import CodeRunner from "@/components/code-runner";
import { supabase } from "@/lib/supabaseClient";
import { extractFirstCodeBlock } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ messageId: string }>;
}): Promise<Metadata> {
  let { messageId } = await params;
  const message = await getMessage(messageId);
  if (!message) {
    notFound();
  }

  let title = message.chat.title;
  let searchParams = new URLSearchParams();
  searchParams.set("prompt", title);

  return {
    title,
    description: `An app generated on LlamaCoder.io: ${title}`,
    openGraph: {
      images: [`/api/og?${searchParams}`],
    },
    twitter: {
      card: "summary_large_image",
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
    console.error("Supabase error fetching message content:", messageError);
    notFound();
  }

  const app = extractFirstCodeBlock(messageData.content);
  if (!app || !app.language) {
    console.warn("Could not extract code block from message:", messageId);
    notFound();
  }

  return (
    <div className="flex h-full w-full grow items-center justify-center">
      <CodeRunner language={app.language} code={app.code} />
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
    console.error("Supabase error in getMessage:", error);
    return null;
  }

  if (data && data.chats) {
    const chatData = data.chats as unknown as { title: string };
    return {
      content: data.content,
      chat: {
        title: chatData.title
      }
    };
  }

  return null;
});
