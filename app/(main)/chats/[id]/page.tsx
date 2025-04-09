// import { getPrisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { cache } from "react";
import PageClient from "./page.client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const chat = await getChatById(id);

  if (!chat) notFound();

  return <PageClient chat={chat} />;
}

const getChatById = cache(async (id: string) => {
  // const prisma = getPrisma();
  const { data: chatData, error } = await supabase
    .from('chats')
    .select(`
      *,
      messages (
        *
      )
    `)
    .eq('id', id)
    .order('position', { referencedTable: 'messages', ascending: true })
    .maybeSingle();

  if (error) {
    console.error("Supabase error fetching chat:", error);
    return null;
  }
  if (!chatData) {
     return null;
  }

  // Ensure messages are sorted correctly (optional safety check)
  // chatData.messages?.sort((a, b) => a.position - b.position);

  // **Manually construct a plain object to ensure serialization**
  const plainChat = {
    id: chatData.id,
    model: chatData.model,
    quality: chatData.quality,
    prompt: chatData.prompt,
    title: chatData.title,
    llamaCoderVersion: chatData.llamaCoderVersion,
    shadcn: chatData.shadcn,
    created_at: chatData.created_at, // Keep dates as strings/ISO format if needed
    messages: chatData.messages.map((msg: Message) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      chat_id: msg.chat_id,
      position: msg.position,
      created_at: msg.created_at
    }))
  };

  // Return the plain object instead of the direct Supabase result
  return plainChat;
});

export type Message = NonNullable<Awaited<ReturnType<typeof getChatById>>>['messages'][number];
export type Chat = Omit<NonNullable<Awaited<ReturnType<typeof getChatById>>>, 'messages'> & { messages: Message[] };

export const runtime = "edge";
export const maxDuration = 45;
