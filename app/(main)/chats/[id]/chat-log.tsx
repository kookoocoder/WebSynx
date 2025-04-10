"use client";

import type { Chat, Message } from "./page";
import ArrowLeftIcon from "@/components/icons/arrow-left";
import { splitByFirstCodeFence } from "@/lib/utils";
import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { Code, Eye, Image as ImageIcon } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ThinkingPill from "@/components/thinking-pill";
import React from "react";
import Image from "next/image";

// Regex to find markdown image links like [Image](url)
const imageLinkRegex = /\n\n\[Image\]\(([^)]+)\)/g;

// Regex to find <think>content</think> tags
const thinkTagRegex = /<think>([\s\S]*?)<\/think>/g;

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
      <StickToBottom.Content className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-2 scrollbar-hide ml-[60px]">
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
  // Extract image URLs and the remaining text
  const images: string[] = [];
  const textContent = content.replace(imageLinkRegex, (_, url) => {
    images.push(url);
    return ""; // Remove the image link from the main text
  }).trim();

  return (
    <div className="relative inline-flex flex-col gap-2 max-w-[80%] items-end self-end">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {images.map((url, index) => (
            <ImagePreview key={index} url={url} />
          ))}
        </div>
      )}
      {textContent && (
        <div className="whitespace-pre-wrap rounded-xl bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-3 text-white shadow-md">
          {textContent}
        </div>
      )}
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
  // Handle <think> tags separately
  let processedContent = content;
  const [isThinking, setIsThinking] = React.useState(false);
  const hasThinkTag = thinkTagRegex.test(content);
  
  React.useEffect(() => {
    if (hasThinkTag) {
      setIsThinking(true);
      // Schedule to set isThinking to false when the streaming response 
      // should be complete or close to complete
      const timer = setTimeout(() => {
        setIsThinking(false);
      }, 3000); // Adjust this timeout as needed
      
      return () => clearTimeout(timer);
    }
  }, [hasThinkTag, content]);
  
  // Extract thinking parts and remove from main content
  processedContent = processedContent.replace(thinkTagRegex, () => {
    return '';
  });
  
  const parts = splitByFirstCodeFence(processedContent);

  return (
    <div>
      {/* Render thinking pill if needed */}
      {hasThinkTag && (
        <ThinkingPill isThinking={isThinking} />
      )}
      
      {parts.map((part, i) => (
        <div key={i}>
          {part.type === "text" ? (
            <div className="rounded-xl bg-gray-800/40 backdrop-blur-[1px] border border-gray-700/60 px-4 py-3 text-gray-200">
              <Markdown className="prose prose-invert prose-gray max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-a:text-purple-400" remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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
                className={`${isActive ? "bg-gray-800/70 border-purple-500/50" : "bg-gray-800/40 hover:bg-gray-800/60 hover:border-gray-600"} inline-flex w-full items-center gap-3 rounded-xl border border-gray-700 backdrop-blur-[1px] p-3 transition-colors`}
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
            // Fallback for streamText or when message is undefined
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
  const parts = rawName.split(/[-_]+/);
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

// New ImagePreview component
function ImagePreview({ url }: { url: string }) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block rounded border border-purple-400/30 p-1 bg-purple-900/30 hover:border-purple-400/50 transition-all"
          >
            <Image 
              width={40}
              height={40}
              src={url} 
              alt="Uploaded preview" 
              className="h-10 w-10 object-cover rounded-sm"
            />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content 
            sideOffset={5}
            className="z-50 rounded-md border border-gray-700 bg-gray-800/90 backdrop-blur-md shadow-lg p-1"
            side="top"
            align="center"
          >
            <Image 
              width={512}
              height={256}
              src={url} 
              alt="Uploaded image preview" 
              className="max-h-64 max-w-md rounded object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
            <Tooltip.Arrow className="fill-gray-800/90" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}