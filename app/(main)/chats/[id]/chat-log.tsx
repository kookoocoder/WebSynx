'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Code, Eye, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import React, { Fragment } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { StickToBottom } from 'use-stick-to-bottom';
import ArrowLeftIcon from '@/components/icons/arrow-left';
import ThinkingPill from '@/components/thinking-pill';
import { splitByFirstCodeFence } from '@/lib/utils';
import type { Chat, Message } from './page';

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
  const assistantMessages = chat.messages.filter((m) => m.role === 'assistant');

  return (
    <StickToBottom
      className="fade-in relative grow overflow-hidden pt-10"
      initial="smooth"
      resize="smooth"
    >
      <StickToBottom.Content className="scrollbar-hide mx-auto ml-[60px] flex w-full max-w-prose flex-col gap-4 px-4 py-2">
        <UserMessage content={chat.prompt} />

        {chat.messages.slice(2).map((message) => (
          <Fragment key={message.id}>
            {message.role === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                isActive={!streamText && activeMessage?.id === message.id}
                message={message}
                onMessageClick={onMessageClick}
                version={
                  assistantMessages.map((m) => m.id).indexOf(message.id) + 1
                }
              />
            )}
          </Fragment>
        ))}

        {streamText && (
          <AssistantMessage
            content={streamText}
            isActive={true}
            version={assistantMessages.length + 1}
          />
        )}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

function UserMessage({ content }: { content: string }) {
  // Extract image URLs and the remaining text
  const images: string[] = [];
  const textContent = content
    .replace(imageLinkRegex, (_, url) => {
      images.push(url);
      return ''; // Remove the image link from the main text
    })
    .trim();

  return (
    <div className="relative inline-flex max-w-[80%] flex-col items-end gap-2 self-end">
      {images.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
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
      {hasThinkTag && <ThinkingPill isThinking={isThinking} />}

      {parts.map((part, i) => (
        <div key={i}>
          {part.type === 'text' ? (
            <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 px-4 py-3 text-gray-200 backdrop-blur-[1px]">
              <Markdown
                className="prose prose-invert prose-gray max-w-none prose-a:text-purple-400 prose-headings:text-gray-200 prose-p:text-gray-300"
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
              >
                {part.content}
              </Markdown>
            </div>
          ) : part.type === 'first-code-fence-generating' ? (
            <div className="my-4">
              <button
                className="inline-flex w-full animate-pulse items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 p-3 backdrop-blur-[1px]"
                disabled
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="font-medium text-gray-200 text-sm leading-none">
                    Generating code...
                  </div>
                </div>
              </button>
            </div>
          ) : message ? (
            <div className="my-4">
              <button
                className={`${isActive ? 'border-purple-500/50 bg-gray-800/70' : 'bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/60'} inline-flex w-full items-center gap-3 rounded-xl border border-gray-700 p-3 backdrop-blur-[1px] transition-colors`}
                onClick={() => onMessageClick(message)}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="font-medium text-gray-200 text-sm leading-none">
                    {toTitleCase(part.filename.name)}{' '}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-gray-400 text-xs leading-none">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {'.'}
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
                className="inline-flex w-full items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-3 backdrop-blur-[1px]"
                disabled
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Code className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="font-medium text-gray-200 text-sm leading-none">
                    {toTitleCase(part.filename.name)}{' '}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-gray-400 text-xs leading-none">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {'.'}
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
    .join(' ');
}

// New ImagePreview component
function ImagePreview({ url }: { url: string }) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a
            className="inline-block rounded border border-purple-400/30 bg-purple-900/30 p-1 transition-all hover:border-purple-400/50"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Image
              alt="Uploaded preview"
              className="h-10 w-10 rounded-sm object-cover"
              height={40}
              src={url}
              width={40}
            />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            align="center"
            className="z-50 rounded-md border border-gray-700 bg-gray-800/90 p-1 shadow-lg backdrop-blur-md"
            side="top"
            sideOffset={5}
          >
            <Image
              alt="Uploaded image preview"
              className="max-h-64 max-w-md rounded object-contain"
              height={256}
              src={url}
              style={{ width: 'auto', height: 'auto' }}
              width={448}
            />
            <Tooltip.Arrow className="fill-gray-800/90" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
