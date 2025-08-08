'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, use, useEffect, useRef, useState } from 'react';
import { ChatCompletionStream } from 'together-ai/lib/ChatCompletionStream.mjs';
import { createMessage } from '@/app/(main)/actions';
import LogoSmall from '@/components/icons/logo-small';
import { splitByFirstCodeFence } from '@/lib/utils';
import { Context } from '../../providers';
import ChatBox from './chat-box';
import ChatLog from './chat-log';
import CodeViewer from './code-viewer';
import CodeViewerLayout from './code-viewer-layout';

export type Chat = {
  id: string;
  model: string;
  prompt: string;
  title: string;
  llamaCoderVersion?: string;
  shadcn?: boolean;
  created_at: string;
  messages: Array<{
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    chat_id: string;
    position: number;
    created_at: string;
  }>;
};

export default function PageClient({ chat }: { chat: Chat }) {
  const context = use(Context);
  const [streamPromise, setStreamPromise] = useState<Promise<Response> | null>(
    context.streamPromise
  );
  const [streamText, setStreamText] = useState('');
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === 'assistant')
  );
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHandlingStreamRef = useRef(false);
  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === 'assistant').at(-1)
  );

  useEffect(() => {
    async function f() {
      if (!streamPromise || isHandlingStreamRef.current) return;

      isHandlingStreamRef.current = true;
      context.setStreamPromise(null);

      const streamResponse = await streamPromise;
      if (!streamResponse.body) {
        console.error('No body on stream response');
        isHandlingStreamRef.current = false;
        setStreamPromise(null);
        return;
      }

      let didPushToCode = false;
      let didPushToPreview = false;

      ChatCompletionStream.fromReadableStream(streamResponse.body)
        .on('content', (delta, content) => {
          setStreamText((text) => text + delta);

          if (
            !didPushToCode &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === 'first-code-fence-generating'
            )
          ) {
            didPushToCode = true;
            setIsShowingCodeViewer(true);
            setActiveTab('code');
          }

          if (
            !didPushToPreview &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === 'first-code-fence'
            )
          ) {
            didPushToPreview = true;
            setIsShowingCodeViewer(true);
            setActiveTab('preview');
          }
        })
        .on('finalContent', async (finalText) => {
          startTransition(async () => {
            const message = await createMessage(
              chat.id,
              finalText,
              'assistant'
            );

            startTransition(() => {
              isHandlingStreamRef.current = false;
              setStreamText('');
              setStreamPromise(null);
              setActiveMessage(message);
              router.refresh();
            });
          });
        });
    }

    void f();
  }, [chat.id, router, streamPromise, context]);

  useEffect(() => {
    const isInitialLoad = searchParams.get('initial') === 'true';
    const hasAssistantMessages = chat.messages.some(
      (m) => m.role === 'assistant'
    );

    if (
      isInitialLoad &&
      !streamPromise &&
      !isHandlingStreamRef.current &&
      !hasAssistantMessages
    ) {
      const firstUserMessage = chat.messages.find((m) => m.position === 1);

      if (firstUserMessage) {
        console.log(
          'Initial load detected, triggering first AI response for message:',
          firstUserMessage.id
        );
        const initialStreamPromise: Promise<Response | null> = fetch(
          '/api/get-next-completion-stream-promise',
          {
            method: 'POST',
            body: JSON.stringify({
              messageId: firstUserMessage.id,
              model: chat.model,
            }),
          }
        ).catch((error) => {
          console.error('Error fetching initial stream promise:', error);
          return null;
        });

        startTransition(() => {
          setStreamPromise(initialStreamPromise as Promise<Response> | null);
          router.replace(`/chats/${chat.id}`);
        });
      } else {
        console.warn(
          'Initial load detected, but first user message (position 1) not found.'
        );
      }
    }
  }, [chat.id, chat.messages, chat.model, router, searchParams, streamPromise]);

  // Check if user is logged in to adjust layout accordingly
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(storedLoginState);

    // Update login state when it changes
    const handleStorageChange = () => {
      const updatedLoginState = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(updatedLoginState);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="h-dvh">
      <div className="flex h-full">
        <div className="mx-auto flex w-full shrink-0 flex-col overflow-hidden lg:w-1/2">
          <div className="absolute top-0 left-[65px] z-10 flex w-full justify-start px-4 pt-3 pb-2">
            <div className="flex items-center gap-2.5">
              <Link
                aria-label="Back to home"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 p-1 shadow-sm transition-opacity hover:opacity-90"
                href="/"
              >
                <ArrowLeft className="h-6 w-6 text-white" />
              </Link>

              <div className="inline-flex items-center">
                <span className="max-w-[250px] truncate font-medium text-gray-200 text-m drop-shadow-sm">
                  {chat.title}
                </span>
              </div>
            </div>
          </div>

          <ChatLog
            activeMessage={activeMessage}
            chat={chat}
            onMessageClick={(message) => {
              if (message !== activeMessage) {
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }
            }}
            streamText={streamText}
          />

          <ChatBox
            chat={chat}
            isStreaming={!!streamPromise}
            onNewStreamPromise={(promise) =>
              startTransition(() => setStreamPromise(promise))
            }
          />
        </div>

        <CodeViewerLayout
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        >
          {isShowingCodeViewer && (
            <CodeViewer
              activeTab={activeTab}
              chat={chat}
              message={activeMessage}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
              onMessageChange={setActiveMessage}
              onRequestFix={(error: string) => {
                startTransition(async () => {
                  let newMessageText =
                    'The code is not working. Can you fix it? Here&apos;s the error:\n\n';
                  newMessageText += error.trimStart();
                  const message = await createMessage(
                    chat.id,
                    newMessageText,
                    'user'
                  );

                  const streamPromiseResult: Promise<Response | null> = fetch(
                    '/api/get-next-completion-stream-promise',
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        messageId: message.id,
                        model: chat.model,
                      }),
                    }
                  ).catch((error) => {
                    console.error(
                      'Error fetching completion stream promise:',
                      error
                    );
                    return null;
                  });

                  startTransition(() => {
                    setStreamPromise(
                      streamPromiseResult as Promise<Response> | null
                    );
                    router.refresh();
                  });
                });
              }}
              onTabChange={setActiveTab}
              streamText={streamText}
            />
          )}
        </CodeViewerLayout>
      </div>
    </div>
  );
}
