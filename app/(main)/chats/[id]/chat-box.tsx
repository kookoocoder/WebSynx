"use client";

import ArrowRightIcon from "@/components/icons/arrow-right";
import Spinner from "@/components/spinner";
import assert from "assert";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createMessage } from "../../actions";
import { type Chat } from "./page";

export default function ChatBox({
  chat,
  onNewStreamPromise,
  isStreaming,
}: {
  chat: Chat;
  onNewStreamPromise: (v: Promise<ReadableStream>) => void;
  isStreaming: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const disabled = isPending || isStreaming;
  const didFocusOnce = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const textareaResizePrompt = prompt
    .split("\n")
    .map((text) => (text === "" ? "a" : text))
    .join("\n");

  useEffect(() => {
    if (!textareaRef.current) return;

    if (!disabled && !didFocusOnce.current) {
      textareaRef.current.focus();
      didFocusOnce.current = true;
    } else {
      didFocusOnce.current = false;
    }
  }, [disabled]);

  return (
    <div className="mx-auto mb-5 flex w-full max-w-prose shrink-0 px-8">
      <form
        className="relative flex w-full"
        action={async () => {
          startTransition(async () => {
            const message = await createMessage(chat.id, prompt, "user");
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

            onNewStreamPromise(streamPromise);
            startTransition(() => {
              router.refresh();
              setPrompt("");
            });
          });
        }}
      >
        <fieldset className="w-full" disabled={disabled}>
          <div className="relative flex rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <div className="relative w-full">
              <div className="w-full p-3">
                <p className="invisible min-h-[48px] w-full whitespace-pre-wrap text-white">
                  {textareaResizePrompt}
                </p>
              </div>
              <textarea
                ref={textareaRef}
                placeholder="Ask a follow-up question..."
                autoFocus={!disabled}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                name="prompt"
                className="peer absolute inset-0 w-full resize-none bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    const target = event.target;
                    if (!(target instanceof HTMLTextAreaElement)) return;
                    target.closest("form")?.requestSubmit();
                  }
                }}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-xl peer-focus:outline peer-focus:outline-offset-0 peer-focus:outline-purple-500" />

            <div className="absolute bottom-2.5 right-2.5 flex has-[:disabled]:opacity-50">
              <button
                className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-2 font-medium text-white shadow-md hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                type="submit"
              >
                <Spinner loading={disabled}>
                  <div className="flex items-center gap-2">
                    <span>Send</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </Spinner>
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
