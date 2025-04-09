"use client";

import { createMessage } from "@/app/(main)/actions";
import LogoSmall from "@/components/icons/logo-small";
import { splitByFirstCodeFence } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, use, useEffect, useRef, useState } from "react";
import { ChatCompletionStream } from "together-ai/lib/ChatCompletionStream.mjs";
import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./code-viewer";
import CodeViewerLayout from "./code-viewer-layout";
import type { Chat } from "./page";
import { Context } from "../../providers";
import { ArrowLeft } from "lucide-react";

export default function PageClient({ chat }: { chat: Chat }) {
  const context = use(Context);
  const [streamPromise, setStreamPromise] = useState<
    Promise<ReadableStream> | undefined
  >(context.streamPromise);
  const [streamText, setStreamText] = useState("");
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHandlingStreamRef = useRef(false);
  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  useEffect(() => {
    async function f() {
      if (!streamPromise || isHandlingStreamRef.current) return;

      isHandlingStreamRef.current = true;
      context.setStreamPromise(undefined);

      const stream = await streamPromise;
      let didPushToCode = false;
      let didPushToPreview = false;

      ChatCompletionStream.fromReadableStream(stream)
        .on("content", (delta, content) => {
          setStreamText((text) => text + delta);

          if (
            !didPushToCode &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence-generating",
            )
          ) {
            didPushToCode = true;
            setIsShowingCodeViewer(true);
            setActiveTab("code");
          }

          if (
            !didPushToPreview &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence",
            )
          ) {
            didPushToPreview = true;
            setIsShowingCodeViewer(true);
            setActiveTab("preview");
          }
        })
        .on("finalContent", async (finalText) => {
          startTransition(async () => {
            const message = await createMessage(
              chat.id,
              finalText,
              "assistant",
            );

            startTransition(() => {
              isHandlingStreamRef.current = false;
              setStreamText("");
              setStreamPromise(undefined);
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
    const hasAssistantMessages = chat.messages.some(m => m.role === 'assistant');

    if (isInitialLoad && !streamPromise && !isHandlingStreamRef.current && !hasAssistantMessages) {
      const firstUserMessage = chat.messages.find(m => m.position === 1);

      if (firstUserMessage) {
        console.log("Initial load detected, triggering first AI response for message:", firstUserMessage.id);
        const initialStreamPromise = fetch(
          "/api/get-next-completion-stream-promise",
          {
            method: "POST",
            body: JSON.stringify({
              messageId: firstUserMessage.id,
              model: chat.model,
            }),
          },
        ).then((res) => {
          if (!res.body) {
            throw new Error("No body on response for initial fetch");
          }
          return res.body;
        }).catch(error => {
          console.error("Error fetching initial stream promise:", error);
          return null;
        });

        if (initialStreamPromise) {
            setStreamPromise(initialStreamPromise as Promise<ReadableStream>);
            router.replace(`/chats/${chat.id}`);
        }
      } else {
        console.warn("Initial load detected, but first user message (position 1) not found.");
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
          <div className="flex justify-start px-4 pt-3 pb-2 absolute top-0 left-0 z-10 w-full">
            <div className="flex items-center gap-2.5">
              <Link 
                href="/" 
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 p-1 shadow-sm transition-opacity hover:opacity-90"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-white" />
              </Link>
              
              <div className="inline-flex items-center">
                <span className="text-xs text-gray-200 font-medium truncate max-w-[250px] drop-shadow-sm">{chat.title}</span>
              </div>
            </div>
          </div>

          <ChatLog
            chat={chat}
            streamText={streamText}
            activeMessage={activeMessage}
            onMessageClick={(message) => {
              if (message !== activeMessage) {
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }
            }}
          />

          <ChatBox
            chat={chat}
            onNewStreamPromise={setStreamPromise}
            isStreaming={!!streamPromise}
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
              streamText={streamText}
              chat={chat}
              message={activeMessage}
              onMessageChange={setActiveMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
              onRequestFix={(error: string) => {
                startTransition(async () => {
                  let newMessageText = `The code is not working. Can you fix it? Here's the error:\n\n`;
                  newMessageText += error.trimStart();
                  const message = await createMessage(
                    chat.id,
                    newMessageText,
                    "user",
                  );

                  const streamPromise = fetch(
                    "/api/get-next-completion-stream-promise",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        messageId: message.id,
                        model: chat.model,
                      }),
                    },
                  ).then((res) => {
                    if (!res.body) {
                      throw new Error("No body on response");
                    }
                    return res.body;
                  });

                  startTransition(() => {
                    setStreamPromise(streamPromise);
                    router.refresh();
                  });
                });
              }}
            />
          )}
        </CodeViewerLayout>
      </div>
    </div>
  );
}
