"use server";

import { supabase /*, getSupabaseAdmin */ } from "@/lib/supabaseClient"; // Standard client for RLS
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // Import helper for server actions
import { cookies } from 'next/headers'; // Import cookies helper
import {
  getMainCodingPrompt,
  screenshotToCodePrompt,
  softwareArchitectPrompt,
} from "@/lib/prompts";
import { notFound } from "next/navigation";
import Together from "together-ai";

// Helper function for error handling (optional but recommended)
async function handleSupabaseError(query: any, context: string) {
    const { data, error } = await query;
    if (error) {
        console.error(`Supabase Error [${context}]:`, error);
        throw new Error(`Supabase operation failed: ${context} - ${error.message}`);
    }
    return data;
}

export async function createChat(
  prompt: string,
  model: string,
  quality: "high" | "low",
  screenshotUrl: string | undefined,
) {
  // Create a Supabase client for Server Actions to get user session if available
  const supabaseServerClient = createServerActionClient({ cookies });
  
  // Try to get the user, but don't require it
  const { data } = await supabaseServerClient.auth.getUser();
  const user = data?.user; // May be null if not logged in
  
  // Prepare chat object with or without user_id
  const chatObject: any = {
    model,
    quality,
    prompt,
    title: "", 
    shadcn: true, 
    "websynxVersion": "v2"
  };
  
  // Only add user_id if a user is logged in
  if (user) {
    chatObject.user_id = user.id;
  }

  // Create chat record using the SERVER ACTION client
  const chatData = await handleSupabaseError(
    supabaseServerClient
      .from('chats')
      .insert(chatObject)
      .select('id') 
      .single(), 
    'insert chat'
  );

  if (!chatData?.id) {
     throw new Error("Failed to create chat or retrieve ID.");
  }
  const chatId = chatData.id;

  let options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-appname": "LlamaCoder",
      "Helicone-Session-Id": chatId, // Use the new chatId
      "Helicone-Session-Name": "LlamaCoder Chat",
    };
  }

  const together = new Together(options);

  async function fetchTitle() {
    const responseForChatTitle = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a chatbot helping the user create a simple app or script, and your current job is to create a succinct title, maximum 3-5 words, for the chat given their initial prompt. Please return only the title.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const title = responseForChatTitle.choices[0].message?.content || prompt;
    return title;
  }

  async function fetchTopExample() {
    const findSimilarExamples = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful bot. Given a request for building an app, you match it to the most similar example provided. If the request is NOT similar to any of the provided examples, return "none". Here is the list of examples, ONLY reply with one of them OR "none":

          - landing page
          - blog app
          - quiz app
          - pomodoro timer
          `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const mostSimilarExample =
      findSimilarExamples.choices[0].message?.content || "none";
    return mostSimilarExample;
  }

  const [title, mostSimilarExample] = await Promise.all([
    fetchTitle(),
    fetchTopExample(),
  ]);

  let fullScreenshotDescription;
  if (screenshotUrl) {
    const screenshotResponse = await together.chat.completions.create({
      model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
      temperature: 0.2,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: screenshotToCodePrompt },
            {
              type: "image_url",
              image_url: {
                url: screenshotUrl,
              },
            },
          ],
        },
      ],
    });

    fullScreenshotDescription = screenshotResponse.choices[0].message?.content;
  }

  let userMessage: string;
  if (quality === "high") {
    let initialRes = await together.chat.completions.create({
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      messages: [
        {
          role: "system",
          content: softwareArchitectPrompt,
        },
        {
          role: "user",
          content: fullScreenshotDescription
            ? fullScreenshotDescription + prompt
            : prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    userMessage = initialRes.choices[0].message?.content ?? prompt;
  } else if (fullScreenshotDescription) {
    userMessage =
      prompt +
      "RECREATE THIS APP AS CLOSELY AS POSSIBLE: " +
      fullScreenshotDescription;
  } else {
    userMessage = prompt;
  }

  // Update chat with title and create initial messages using the SERVER ACTION client
  const systemMessageContent = getMainCodingPrompt(mostSimilarExample);

  // Insert initial messages using the SERVER ACTION client
  await handleSupabaseError(
    supabaseServerClient // Use server client here too
      .from('messages')
      .insert([
        { role: "system", content: systemMessageContent, position: 0, chat_id: chatId },
        { role: "user", content: userMessage, position: 1, chat_id: chatId }
      ]),
    'insert initial messages'
  );

  // Update the chat title using the SERVER ACTION client
  await handleSupabaseError(
    supabaseServerClient // Use server client here too
      .from('chats')
      .update({ title: title })
      .eq('id', chatId),
    'update chat title'
  );

  // Find the last message using the SERVER ACTION client
  const lastMessageData = await handleSupabaseError(
    supabaseServerClient // Use server client here too
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)
      .eq('position', 1)
      .single(),
    'find last message'
  );

  if (!lastMessageData?.id) throw new Error("Could not find the created user message");

  return {
    chatId: chatId,
    lastMessageId: lastMessageData.id,
  };
}

export async function createMessage(
  chatId: string,
  text: string,
  role: "assistant" | "user",
) {
  const supabaseServerClient = createServerActionClient({ cookies }); // Create server client
  
  // Try to get the user, but don't require it
  const { data } = await supabaseServerClient.auth.getUser();
  const user = data?.user; // May be null if not logged in
  
  // Skip user ownership checks if no user is logged in
  if (user) {
    // Optionally check if the chat belongs to this user before adding a message
    try {
      const { data: chatOwner } = await supabaseServerClient
        .from('chats')
        .select('user_id')
        .eq('id', chatId)
        .single();
      
      // If chat has an owner (user_id) and it's not the current user, don't allow them to add messages
      if (chatOwner?.user_id && chatOwner.user_id !== user.id) {
        console.warn("User trying to add message to someone else's chat");
        // You could throw an error here, or just log and continue
        // throw new Error("Cannot create message in someone else's chat");
      }
    } catch (error) {
      // Ignore error, continue with message creation
    }
  }

  // Find the highest current position for the chat
  const { data: maxPosData, error: maxPosError } = await supabaseServerClient
    .from('messages')
    .select('position')
    .eq('chat_id', chatId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle(); 

  if (maxPosError) {
    console.error(`Supabase Error [find max position]:`, maxPosError);
    throw new Error(`Supabase operation failed: find max position - ${maxPosError.message}`);
  }

  const maxPosition = maxPosData?.position ?? -1; 

  // Insert the new message
  const newMessageData = await handleSupabaseError(
    supabaseServerClient
      .from('messages')
      .insert({
        role,
        content: text,
        position: maxPosition + 1,
        chat_id: chatId, 
      })
      .select() 
      .single(), 
    'insert message'
  );

  return newMessageData; 
}
