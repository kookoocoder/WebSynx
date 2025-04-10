/* eslint-disable @next/next/no-img-element */
// import { getPrisma } from "@/lib/prisma"; // Remove Prisma import
import { supabase } from "@/lib/supabaseClient"; // Add Supabase client import
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { messageId: string };
}) {
  let messageId = params.messageId;
  // const prisma = getPrisma(); // Remove Prisma client instantiation
  // let message = await prisma.message.findUnique({ // Remove Prisma query
  //   where: {
  //     id: messageId,
  //   },
  //   include: {
  //     chat: true,
  //   },
  // });

  // Use Supabase to fetch the message and related chat title
  const { data: messageData, error: dbError } = await supabase
    .from('messages') // Assuming table name is 'messages'
    .select(`
      id,
      chat_id,
      chats ( title ) 
    `) // Corrected select query, removed comment
    .eq('id', messageId)
    .maybeSingle(); // Use maybeSingle to handle null without error

  if (dbError) {
    console.error("Error fetching message for OG image:", dbError);
    // Optionally: return a default error image response here
  }

  const backgroundData = await readFile(
    join(process.cwd(), "./public/dynamic-og.png"),
  );
  const backgroundSrc = Uint8Array.from(backgroundData).buffer;

  // Use messageData from Supabase, provide default title if not found or error
  // Type assertion needed because Supabase types might not infer nested relation structure perfectly
  const chatTitle = (messageData as any)?.chats?.title;
  let title = chatTitle || "An app generated on LlamaCoder.io";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* @ts-expect-error */}
        <img src={backgroundSrc} height="100%" alt="" />
        <div
          style={{
            position: "absolute",
            fontSize: 50,
            color: "black",
            padding: "50px 200px",
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
