import Together from 'together-ai';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { decryptFromBase64 } from '@/lib/crypto';

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

  // Require auth for any usage
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'AUTH_REQUIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch personal key if present
  const { data: secretRow } = await supabase
    .from('user_secrets')
    .select('together_api_key_ciphertext')
    .eq('user_id', user.id)
    .maybeSingle();

  let togetherApiKey: string | undefined;
  if (secretRow?.together_api_key_ciphertext) {
    try {
      togetherApiKey = await decryptFromBase64(secretRow.together_api_key_ciphertext);
    } catch (_) {
      togetherApiKey = undefined;
    }
  }

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
    return new Response(
      JSON.stringify({ error: 'Failed to fetch message history.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let messages: z.infer<typeof messagesSchema> = [];
  try {
    messages = messagesSchema.parse(messagesRes ?? []);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid message data format received from DB.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!messages || messages.length === 0) {
    messages = [{ role: 'system', content: 'You are a helpful coding assistant.' }];
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

  // Prefer user key if supplied, else fallback to server env default
  if (togetherApiKey) {
    options.apiKey = togetherApiKey;
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
    return new Response(
      JSON.stringify({ error: 'Failed to get response from AI service.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 45;
