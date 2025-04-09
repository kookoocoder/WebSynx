"use server";

import { supabase /*, getSupabaseAdmin */ } from "@/lib/supabaseClient"; // Choose client based on RLS needs
import {
  getMainCodingPrompt,
  screenshotToCodePrompt,
  softwareArchitectPrompt,
} from "@/lib/prompts";
import { notFound } from "next/navigation";
import Together from "together-ai";

// Helper function for error handling (optional but recommended)
async function handleSupabaseError(promise: Promise<any>, context: string) {
    const { data, error } = await promise;
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
  // Use the standard Supabase client (or admin if needed)
  const dbClient = supabase; // or getSupabaseAdmin(); if RLS bypass needed

  // Create chat record using Supabase
  const chatData = await handleSupabaseError(
    dbClient
      .from('chats')
      .insert({
        model,
        quality,
        prompt,
        title: "", // Title is updated later
        shadcn: true, // Assuming this is constant based on original code
        "llamaCoderVersion": "v2" // Match schema default/column name
      })
      .select('id') // Select only the ID initially
      .single(), // Expecting a single row back
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

  // Update chat with title and create initial messages using Supabase
  const systemMessageContent = getMainCodingPrompt(mostSimilarExample);

  // Insert initial messages
  await handleSupabaseError(
    dbClient
      .from('messages')
      .insert([
        { role: "system", content: systemMessageContent, position: 0, chat_id: chatId },
        { role: "user", content: userMessage, position: 1, chat_id: chatId }
      ]),
    'insert initial messages'
  );

  // Update the chat title
  await handleSupabaseError(
    dbClient
      .from('chats')
      .update({ title: title })
      .eq('id', chatId),
    'update chat title'
  );

  // Find the last message (user message we just inserted) to return its ID
  // We know its position is 1
  const lastMessageData = await handleSupabaseError(
    dbClient
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
  const dbClient = supabase; // or getSupabaseAdmin();

  // Find the highest current position for the chat
  const { data: maxPosData, error: maxPosError } = await dbClient
    .from('messages')
    .select('position')
    .eq('chat_id', chatId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle as there might be no messages yet (though unlikely here)

  if (maxPosError) {
    console.error(`Supabase Error [find max position]:`, maxPosError);
    throw new Error(`Supabase operation failed: find max position - ${maxPosError.message}`);
  }

  const maxPosition = maxPosData?.position ?? -1; // Default to -1 if no messages exist

  // Insert the new message
  const newMessageData = await handleSupabaseError(
    dbClient
      .from('messages')
      .insert({
        role,
        content: text,
        position: maxPosition + 1,
        chat_id: chatId, // Ensure correct column name
      })
      .select() // Select all columns of the new message
      .single(), // Expecting a single row back
    'insert message'
  );

  return newMessageData; // Return the full message object as returned by Supabase
}
