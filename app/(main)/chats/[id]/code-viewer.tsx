'use client';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { StickToBottom } from 'use-stick-to-bottom';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import ChevronRightIcon from '@/components/icons/chevron-right';
import CloseIcon from '@/components/icons/close-icon';
import RefreshIcon from '@/components/icons/refresh';
import { extractFirstCodeBlock, splitByFirstCodeFence } from '@/lib/utils';
import type { Chat } from './page.client';
type Message = Chat['messages'][number];
import { Share } from './share';

const CodeRunner = dynamic(() => import('@/components/code-runner'), {
  ssr: false,
});
const SyntaxHighlighter = dynamic(
  () => import('@/components/syntax-highlighter'),
  {
    ssr: false,
  }
);

export default function CodeViewer({
  chat,
  streamText,
  message,
  onMessageChange,
  activeTab,
  onTabChange,
  onClose,
  onRequestFix,
}: {
  chat: Chat;
  streamText: string;
  message?: Message;
  onMessageChange: (v: Message) => void;
  activeTab: string;
  onTabChange: (v: 'code' | 'preview') => void;
  onClose: () => void;
  onRequestFix: (e: string) => void;
}) {
  const app = message ? extractFirstCodeBlock(message.content) : undefined;
  const streamAppParts = splitByFirstCodeFence(streamText);
  const streamApp = streamAppParts.find(
    (p) =>
      p.type === 'first-code-fence-generating' || p.type === 'first-code-fence'
  );
  const streamAppIsGenerating = streamAppParts.some(
    (p) => p.type === 'first-code-fence-generating'
  );

  const code = streamApp ? streamApp.content : app?.code || '';
  const language = streamApp ? streamApp.language : app?.language || '';
  const title = streamApp ? streamApp.filename.name : app?.filename?.name || '';
  const layout = ['python', 'ts', 'js', 'javascript', 'typescript'].includes(
    language
  )
    ? 'two-up'
    : 'tabbed';

  const assistantMessages = chat.messages.filter(
    (m: Message) => m.role === 'assistant'
  );
  const currentVersion = streamApp
    ? assistantMessages.length
    : message
      ? assistantMessages.map((m: Message) => m.id).indexOf(message.id)
      : 1;
  const previousMessage =
    currentVersion !== 0 ? assistantMessages.at(currentVersion - 1) : undefined;
  const nextMessage =
    currentVersion < assistantMessages.length
      ? assistantMessages.at(currentVersion + 1)
      : undefined;

  const [refresh, setRefresh] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Function to copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-gray-700/70 border-b bg-gray-900 px-4 text-gray-100">
        <div className="inline-flex items-center gap-4">
          <button
            className="text-gray-400 hover:text-purple-300"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
              <Code className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {title} v{currentVersion + 1}
            </span>
          </div>
        </div>
        {layout === 'tabbed' && (
          <div className="flex items-center gap-2">
            {activeTab === 'code' && (
              <button
                aria-label="Copy code to clipboard"
                className={`inline-flex h-7 items-center justify-center gap-1.5 rounded border border-purple-700/20 bg-gray-800/40 px-2.5 font-medium text-gray-300 text-xs transition-all hover:bg-gray-700/50 hover:text-white ${isCopied ? 'border-green-500/30 bg-green-500/10' : ''}`}
                onClick={copyToClipboard}
              >
                {isCopied ? (
                  <>
                    <Check className="fade-in zoom-in-50 h-3.5 w-3.5 animate-in text-green-400 duration-300" />
                    <span className="fade-in slide-in-from-left-1 animate-in duration-300">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}

            <div className="rounded-lg border border-purple-700/20 bg-gray-800/40 p-1">
              <button
                className="inline-flex h-7 w-16 items-center justify-center rounded font-medium text-xs transition-colors hover:bg-gray-700/50 data-[active]:bg-gradient-to-r data-[active]:from-purple-700 data-[active]:via-pink-600 data-[active]:to-indigo-700 data-[active]:text-white"
                data-active={activeTab === 'code' ? true : undefined}
                onClick={() => onTabChange('code')}
              >
                Code
              </button>
              <button
                className="inline-flex h-7 w-16 items-center justify-center rounded font-medium text-xs transition-colors hover:bg-gray-700/50 data-[active]:bg-gradient-to-r data-[active]:from-purple-700 data-[active]:via-pink-600 data-[active]:to-indigo-700 data-[active]:text-white"
                data-active={activeTab === 'preview' ? true : undefined}
                onClick={() => onTabChange('preview')}
              >
                Preview
              </button>
            </div>
          </div>
        )}
      </div>

      {layout === 'tabbed' ? (
        <div className="scrollbar-hide flex grow flex-col overflow-y-auto bg-gray-900">
          {activeTab === 'code' ? (
            <StickToBottom
              className="relative grow overflow-hidden"
              initial={streamAppIsGenerating ? 'smooth' : false}
              resize="smooth"
            >
              <StickToBottom.Content className="scrollbar-hide">
                <SyntaxHighlighter code={code} language={language} />
              </StickToBottom.Content>
            </StickToBottom>
          ) : (
            <>
              {language && (
                <div className="flex h-full items-center justify-center bg-transparent p-4">
                  <CodeRunner
                    code={code}
                    key={refresh}
                    language={language}
                    onRequestFix={onRequestFix}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex grow flex-col bg-gray-900">
          <div className="scrollbar-hide relative h-1/2 overflow-y-auto">
            <div className="absolute top-2 right-2 z-10">
              <button
                aria-label="Copy code to clipboard"
                className={`inline-flex items-center justify-center gap-1.5 rounded border border-purple-700/20 bg-gray-800/80 px-2 py-1 font-medium text-gray-300 text-xs backdrop-blur-sm transition-all hover:bg-gray-700/50 hover:text-white ${isCopied ? 'border-green-500/30 bg-green-500/10' : ''}`}
                onClick={copyToClipboard}
              >
                {isCopied ? (
                  <>
                    <Check className="fade-in zoom-in-50 h-3.5 w-3.5 animate-in text-green-400 duration-300" />
                    <span className="fade-in slide-in-from-left-1 animate-in duration-300">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter code={code} language={language} />
          </div>
          <div className="flex h-1/2 flex-col">
            <div className="border-gray-700/70 border-t bg-gray-900 px-4 py-4 text-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex size-4 items-center justify-center rounded-full bg-purple-500/20">
                  <span className="size-2 rounded-full bg-purple-400" />
                </div>
                <span>Output</span>
              </div>
            </div>
            <div className="flex grow items-center justify-center border-gray-700/70 border-t bg-transparent p-4">
              {!streamAppIsGenerating && (
                <CodeRunner
                  code={code}
                  key={refresh}
                  language={language}
                  onRequestFix={onRequestFix}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-gray-700/70 border-t bg-gray-900 px-4 py-4">
        <div className="inline-flex items-center gap-2.5 text-sm">
          <Share message={message && !streamApp ? message : undefined} />
          <button
            className="inline-flex items-center gap-1 rounded border border-purple-700/20 bg-gray-800/50 px-2 py-1 text-gray-200 text-sm transition enabled:hover:border-purple-700/30 enabled:hover:bg-gray-800/70 disabled:opacity-50"
            onClick={() => setRefresh((r) => r + 1)}
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 text-gray-200">
          {previousMessage ? (
            <button
              className="text-gray-400 hover:text-purple-300"
              onClick={() => onMessageChange(previousMessage)}
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : (
            <button className="text-gray-400 opacity-25" disabled>
              <ChevronLeft className="size-4" />
            </button>
          )}

          <p className="text-sm">
            Version <span className="tabular-nums">{currentVersion + 1}</span>{' '}
            <span className="text-gray-400">of</span>{' '}
            <span className="tabular-nums">
              {Math.max(currentVersion + 1, assistantMessages.length)}
            </span>
          </p>

          {nextMessage ? (
            <button
              className="text-gray-400 hover:text-purple-300"
              onClick={() => onMessageChange(nextMessage)}
            >
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button className="text-gray-400 opacity-25" disabled>
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
