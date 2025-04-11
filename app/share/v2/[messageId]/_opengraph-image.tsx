/* eslint-disable @next/next/no-img-element */
import { supabase } from "@/lib/supabaseClient";
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
  const { messageId } = params;

  const { data: messageData, error } = await supabase
    .from('messages')
    .select(`
      id,
      chat_id,
      chats ( title )
    `)
    .eq('id', messageId)
    .single();

  if (error) {
    console.error("Error fetching message from Supabase:", error);
  }

  const backgroundData = await readFile(
    join(process.cwd(), "./public/dynamic-og.png"),
  );
  const backgroundSrc = Uint8Array.from(backgroundData).buffer;

  const title = (messageData?.chats && Array.isArray(messageData.chats) && messageData.chats.length > 0)
    ? messageData.chats[0]?.title
    : "An app generated on WebSynx";

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
          {title || "An app generated on WebSynx"}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
