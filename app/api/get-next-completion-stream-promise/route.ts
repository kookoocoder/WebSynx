import Together from 'together-ai';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});
const messagesSchema = z.array(messageSchema);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const { messageId, model } = await req.json();
  const supabase = await getServerSupabase(true);

  // Retry fetching the target message in case the insert just committed
  let targetMessage: { id: string; chat_id: string; position: number } | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, chat_id, position')
      .eq('id', messageId)
      .single();
    if (!error && data) {
      targetMessage = data as any;
      break;
    }
    lastErr = error;
    await sleep(150);
  }

  if (!targetMessage) {
    console.error('Supabase error fetching target message (after retries):', lastErr);
    return new Response(
      JSON.stringify({ error: 'Target message not found or DB error.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data: messagesRes, error: historyError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', targetMessage.chat_id)
    .lte('position', targetMessage.position)
    .order('position', { ascending: true });

  if (historyError) {
    console.error('Supabase error fetching message history:', historyError);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch message history.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let messages: z.infer<typeof messagesSchema> = [];
  try {
    messages = messagesSchema.parse(messagesRes ?? []);
  } catch (validationError) {
    console.error('Zod validation error on fetched messages:', validationError);
    return new Response(
      JSON.stringify({
        error: 'Invalid message data format received from DB.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Ensure there is at least one system message if history is empty
  if (!messages || messages.length === 0) {
    messages = [
      { role: 'system', content: 'You are a helpful coding assistant.' },
    ];
  }

  if (messages.length > 10) {
    messages = [messages[0], messages[1], messages[2], ...messages.slice(-7)];
  }

  const options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = 'https://together.helicone.ai/v1';
    options.defaultHeaders = {
      'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
      'Helicone-Property-appname': 'Websynx',
      'Helicone-Session-Id': targetMessage.chat_id,
      'Helicone-Session-Name': 'Websynx Chat',
    };
  }

  const together = new Together(options);

  try {
    const res = await together.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: 0.2,
      max_tokens: 9000,
    });

    return new Response(res.toReadableStream());
  } catch (aiError) {
    console.error('Together AI Error:', aiError);
    return new Response(
      JSON.stringify({ error: 'Failed to get response from AI service.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 45;
