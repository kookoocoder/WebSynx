"use client";

import type { Chat, Message } from "./page";
import ArrowLeftIcon from "@/components/icons/arrow-left";
import { splitByFirstCodeFence } from "@/lib/utils";
import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { Code, Eye } from "lucide-react";

export default function ChatLog({
  chat,
  activeMessage,
  streamText,
  onMessageClick,
}: {
  chat: Chat;
  activeMessage?: Message;
  streamText: string;
  onMessageClick: (v: Message) => void;
}) {
  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");

  return (
    <StickToBottom
      className="relative grow overflow-hidden pt-10 fade-in"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-2 scrollbar-hide">
        <UserMessage content={chat.prompt} />

        {chat.messages.slice(2).map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                version={
                  assistantMessages.map((m) => m.id).indexOf(message.id) + 1
                }
                message={message}
                isActive={!streamText && activeMessage?.id === message.id}
                onMessageClick={onMessageClick}
              />
            )}
          </Fragment>
        ))}

        {streamText && (
          <AssistantMessage
            content={streamText}
            version={assistantMessages.length + 1}
            isActive={true}
          />
        )}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="relative inline-flex max-w-[80%] items-end gap-3 self-end">
      <div className="whitespace-pre-wrap rounded-xl bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-3 text-white shadow-md">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  version,
  message,
  isActive,
  onMessageClick = () => {},
}: {
  content: string;
  version: number;
  message?: Message;
  isActive?: boolean;
  onMessageClick?: (v: Message) => void;
}) {
  const parts = splitByFirstCodeFence(content);

  return (
    <div>
      {parts.map((part, i) => (
        <div key={i}>
          {part.type === "text" ? (
            <div className="rounded-xl bg-gray-800/40 backdrop-blur-[1px] border border-gray-700/60 px-4 py-3 text-gray-200">
              <Markdown className="prose prose-invert prose-gray max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-a:text-purple-400">
                {part.content}
              </Markdown>
            </div>
          ) : part.type === "first-code-fence-generating" ? (
            <div className="my-4">
              <button
                disabled
                className="inline-flex w-full animate-pulse items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-[1px] p-3"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none text-gray-200">
                    Generating code...
                  </div>
                </div>
              </button>
            </div>
          ) : message ? (
            <div className="my-4">
              <button
                className={`${
                  isActive 
                    ? "bg-gray-800/70 border-purple-500/50" 
                    : "bg-gray-800/40 hover:bg-gray-800/60 hover:border-gray-600"
                } inline-flex w-full items-center gap-3 rounded-xl border border-gray-700 backdrop-blur-[1px] p-3 transition-colors`}
                onClick={() => onMessageClick(message)}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none text-gray-200">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-400">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
                </div>
                <div className="ml-auto">
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            </div>
          ) : (
            <div className="my-4">
              <button
                className="inline-flex w-full items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-[1px] p-3"
                disabled
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none text-gray-200">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-400">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
                </div>
                <div className="ml-auto">
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function toTitleCase(rawName: string): string {
  // Split on one or more hyphens or underscores
  const parts = rawName.split(/[-_]+/);

  // Capitalize each part and join them back with spaces
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
