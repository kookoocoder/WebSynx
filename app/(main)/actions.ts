'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import Together from 'together-ai';
import {
  getMainCodingPrompt,
  screenshotToCodePrompt,
  softwareArchitectPrompt,
} from '@/lib/prompts';
import { examples } from '@/lib/shadcn-examples';
import { getServerSupabase } from '@/lib/supabase-server';

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
  quality: 'high' | 'low',
  screenshotUrl: string | undefined
) {
  // Next 15: await cookies() and pass a function wrapper
  const supabaseServerClient = await getServerSupabase(true);

  // Try to get the user, but don't require it
  const { data } = await supabaseServerClient.auth.getUser();
  const user = data?.user; // May be null if not logged in

  // Prepare chat object with or without user_id
  const chatObject: any = {
    model,
    quality,
    prompt,
    title: '',
    shadcn: true,
    websynxVersion: 'v2',
  };

  // Only add user_id if a user is logged in
  if (user) {
    chatObject.user_id = user.id;
  }

  // Create chat record using the SERVER ACTION client
  const chatData = await handleSupabaseError(
    supabaseServerClient.from('chats').insert(chatObject).select('id').single(),
    'insert chat'
  );

  if (!chatData?.id) {
    throw new Error('Failed to create chat or retrieve ID.');
  }
  const chatId = chatData.id;

  const options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = 'https://together.helicone.ai/v1';
    options.defaultHeaders = {
      'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
      'Helicone-Property-appname': 'Websynx',
      'Helicone-Session-Id': chatId, // Use the new chatId
      'Helicone-Session-Name': 'Websynx Chat',
    };
  }

  const together = new Together(options);

  async function fetchTitle() {
    const responseForChatTitle = await together.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'You are a chatbot helping the user create a simple app or script, and your current job is to create a succinct title, maximum 3-5 words, for the chat given their initial prompt. Please return only the title.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    const title = responseForChatTitle.choices[0].message?.content || prompt;
    return title;
  }

  async function fetchTopExample() {
    const shadcnExamples = Object.keys(examples).join('\n');
    const findSimilarExamples = await together.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that finds the most similar example from a list of examples based on a user prompt. You will be given a list of examples and a user prompt. Your job is to return the most similar example from the list. Return only the example, nothing else.',
        },
        {
          role: 'user',
          content: `Examples:\n${shadcnExamples}\n\nUser prompt: ${prompt}\n\nMost similar example:`,
        },
      ],
    });
    const mostSimilarExample =
      findSimilarExamples.choices[0].message?.content || '';
    return mostSimilarExample;
  }

  // Run both async operations concurrently
  const [title, mostSimilarExample] = await Promise.all([
    fetchTitle(),
    fetchTopExample(),
  ]);

  let fullScreenshotDescription = '';

  if (screenshotUrl) {
    const screenshotResponse = await together.chat.completions.create({
      model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      temperature: 0.2,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: screenshotToCodePrompt },
            {
              type: 'image_url',
              image_url: {
                url: screenshotUrl,
              },
            },
          ],
        },
      ],
    });

    fullScreenshotDescription = screenshotResponse.choices[0].message?.content || '';
  }

  let userMessage: string;
  if (quality === 'high') {
    const initialRes = await together.chat.completions.create({
      model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      messages: [
        {
          role: 'system',
          content: softwareArchitectPrompt,
        },
        {
          role: 'user',
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
      'RECREATE THIS APP AS CLOSELY AS POSSIBLE: ' +
      fullScreenshotDescription;
  } else {
    userMessage = prompt;
  }

  // Update chat with title and create initial messages using the SERVER ACTION client
  const systemMessageContent = getMainCodingPrompt(mostSimilarExample);

  // Insert initial messages using the SERVER ACTION client
  const insertedMessages = await handleSupabaseError(
    supabaseServerClient
      .from('messages')
      .insert([
        {
          role: 'system',
          content: systemMessageContent,
          position: 0,
          chat_id: chatId,
        },
        { role: 'user', content: userMessage, position: 1, chat_id: chatId },
      ])
      .select('id, position')
      .order('position', { ascending: true }),
    'insert initial messages'
  );

  // Update the chat title using the SERVER ACTION client
  await handleSupabaseError(
    supabaseServerClient // Use server client here too
      .from('chats')
      .update({ title })
      .eq('id', chatId),
    'update chat title'
  );

  // Invalidate the cache for the chat page
  revalidatePath(`/chats/${chatId}`);

  // Extract the user message id from the insert response to avoid a follow-up SELECT
  const userMessageRow = Array.isArray(insertedMessages)
    ? insertedMessages.find((m: { position: number }) => m.position === 1)
    : null;

  if (!userMessageRow?.id) {
    throw new Error('Could not determine the created user message id');
  }

  return {
    chatId,
    lastMessageId: userMessageRow.id as string,
  };
}

export async function createMessage(
  chatId: string,
  text: string,
  role: 'assistant' | 'user'
) {
  const supabaseServerClient = await getServerSupabase(true); // Create server client

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
    console.error('Supabase Error [find max position]:', maxPosError);
    throw new Error(
      `Supabase operation failed: find max position - ${maxPosError.message}`
    );
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
