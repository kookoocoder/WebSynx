'use client';

import * as Select from '@radix-ui/react-select';
import * as Tooltip from '@radix-ui/react-tooltip';
import assert from 'assert';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Upload,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  type DragEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import ArrowRightIcon from '@/components/icons/arrow-right';
import UploadIcon from '@/components/icons/upload-icon';
import Spinner from '@/components/spinner';
import { MODELS } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';
import { createMessage } from '../../actions';
import type { Chat } from './page';

export default function ChatBox({
  chat,
  onNewStreamPromise,
  isStreaming,
}: {
  chat: Chat;
  onNewStreamPromise: (v: Promise<Response>) => void;
  isStreaming: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const disabled = isPending || isStreaming;
  const didFocusOnce = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(chat.model || MODELS[0].value);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const selectedModel = MODELS.find((m) => m.value === model);

  const textareaResizePrompt = prompt
    .split('\n')
    .map((text) => (text === '' ? 'a' : text))
    .join('\n');

  useEffect(() => {
    if (!textareaRef.current) return;

    if (disabled || didFocusOnce.current) {
      didFocusOnce.current = false;
    } else {
      textareaRef.current.focus();
      didFocusOnce.current = true;
    }
  }, [disabled]);

  const handleSingleScreenshotUpload = async (
    file: File
  ): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for uploaded file.');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      return null;
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setScreenshotLoading(true);
    const uploadPromises = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => handleSingleScreenshotUpload(file));

    const urls = (await Promise.all(uploadPromises)).filter(
      (url): url is string => url !== null
    );

    setScreenshotUrls((prevUrls) => [...prevUrls, ...urls]);
    if (prompt.length === 0 && urls.length > 0)
      setPrompt('Analyze these images and provide insights.');
    setScreenshotLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(disabled || screenshotLoading)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    const containsRelated = e.currentTarget.contains(relatedTarget);
    if (!containsRelated) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(disabled || screenshotLoading)) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || screenshotLoading) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setScreenshotLoading(true);
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) =>
          handleSingleScreenshotUpload(file)
        );
        const urls = (await Promise.all(uploadPromises)).filter(
          (url): url is string => url !== null
        );

        setScreenshotUrls((prevUrls) => [...prevUrls, ...urls]);
        if (prompt.length === 0 && urls.length > 0)
          setPrompt('Analyze these images and provide insights.');
      }
      setScreenshotLoading(false);
    }
  };

  const removeScreenshotUrl = (urlToRemove: string) => {
    setScreenshotUrls((prevUrls) =>
      prevUrls.filter((url) => url !== urlToRemove)
    );
    if (
      screenshotUrls.length === 1 &&
      prompt === 'Analyze these images and provide insights.'
    ) {
      setPrompt('');
    }
  };

  return (
    <div className="mx-auto mb-5 flex w-full max-w-[calc(65ch+60px)] shrink-0 px-8">
      <form
        action={async () => {
          startTransition(async () => {
            const imageLinks = screenshotUrls
              .map((url) => `[Image](${url})`)
              .join('\n');
            const messageText =
              screenshotUrls.length > 0 ? `${prompt}\n\n${imageLinks}` : prompt;

            const message = await createMessage(chat.id, messageText, 'user');
            const streamPromise = fetch(
              '/api/get-next-completion-stream-promise',
              {
                method: 'POST',
                body: JSON.stringify({
                  messageId: message.id,
                  model,
                }),
              }
            ).then((res) => {
              if (!res.body) {
                throw new Error('No body on response');
              }
              return res;
            });

            onNewStreamPromise(streamPromise);
            startTransition(() => {
              router.refresh();
              setPrompt('');
              setScreenshotUrls([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            });
          });
        }}
        className="relative flex w-full"
      >
        <fieldset className="w-full" disabled={disabled}>
          <div
            className={`relative flex flex-col rounded-xl border ${isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50'} ml-[35px] backdrop-blur-sm transition-colors`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-800/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-purple-400" />
                  <p className="text-gray-200 text-sm">Drop your image here</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {screenshotUrls.length > 0 && (
                <motion.div
                  animate={{ opacity: 1, height: 'auto', marginTop: '8px' }}
                  className={`flex flex-wrap gap-2 px-3 ${isPending ? 'invisible' : ''} overflow-hidden`}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {screenshotUrls.map((url, index) => (
                    <Tooltip.Provider delayDuration={100} key={url}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="group relative inline-flex items-center gap-2 rounded-full border border-purple-700/30 bg-gray-700/50 py-1 pr-2 pl-1 backdrop-blur-sm">
                            <Image
                              alt={`screenshot preview ${index + 1}`}
                              className="h-5 w-5 rounded-full object-cover"
                              height={20}
                              src={url}
                              width={20}
                            />
                            <span className="font-medium text-purple-300 text-xs">
                              Image {index + 1}
                            </span>
                            <button
                              aria-label={`Remove image ${index + 1}`}
                              className="-right-1 -top-1 absolute z-10 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-gray-300 opacity-0 transition-opacity hover:bg-red-500/50 hover:text-white group-hover:opacity-100"
                              onClick={() => removeScreenshotUrl(url)}
                              type="button"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            align="start"
                            className="z-50 rounded-md border border-gray-700 bg-gray-800/90 p-1 shadow-lg backdrop-blur-md"
                            side="top"
                            sideOffset={5}
                          >
                            <Image
                              alt={`Uploaded image preview ${index + 1}`}
                              className="max-h-48 max-w-xs rounded object-contain"
                              height={192}
                              src={url}
                              style={{ width: 'auto', height: 'auto' }}
                              width={320}
                            />
                            <Tooltip.Arrow className="fill-gray-800/90" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-full">
              <div className="w-full p-3 pt-0">
                <p className="invisible min-h-[48px] w-full whitespace-pre-wrap text-white">
                  {textareaResizePrompt}
                </p>
              </div>
              <textarea
                autoFocus={!disabled}
                className={`peer absolute inset-0 w-full resize-none bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 ${screenshotUrls.length > 0 ? 'pt-14' : 'pt-3'}`}
                name="prompt"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    const target = event.target;
                    if (!(target instanceof HTMLTextAreaElement)) return;
                    target.closest('form')?.requestSubmit();
                  }
                }}
                placeholder={
                  screenshotUrls.length > 0
                    ? 'Describe the image(s) or ask a question...'
                    : 'Ask a follow-up question...'
                }
                ref={textareaRef}
                required
                value={prompt}
              />
            </div>

            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              ref={fileInputRef}
              type="file"
            />

            <div className="pointer-events-none absolute inset-0 rounded-xl peer-focus:outline peer-focus:outline-purple-500 peer-focus:outline-offset-0" />

            <div className="flex items-center justify-between px-3 pt-2 pb-2.5">
              <button
                aria-label="Upload File(s)"
                className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700/40 bg-gray-800/60 p-1 text-gray-400 backdrop-blur-sm transition-all hover:bg-gray-700/50 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 disabled:opacity-50"
                disabled={isPending || isStreaming || screenshotLoading}
                onClick={() => fileInputRef.current?.click()}
                title="Upload File(s)"
                type="button"
              >
                {screenshotLoading ? (
                  <Spinner className="h-3.5 w-3.5 text-purple-400" />
                ) : (
                  <UploadIcon className="h-3.5 w-3.5" />
                )}
                <span className="invisible absolute bottom-full left-0 z-10 mb-1.5 rounded border border-gray-700/40 bg-gray-800/90 px-2 py-1 text-gray-200 text-xs opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:visible group-hover:opacity-100">
                  Upload File(s)
                </span>
              </button>

              <div className="flex items-center gap-2.5">
                <Select.Root
                  name="model"
                  onValueChange={setModel}
                  value={model}
                >
                  <Select.Trigger className="inline-flex items-center gap-1 rounded-md border border-gray-700/40 bg-gray-800/60 p-1.5 text-gray-300 text-sm backdrop-blur-sm transition-colors hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500">
                    <Select.Value aria-label={model}>
                      <span>{selectedModel?.label}</span>
                    </Select.Value>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      align="end"
                      className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-96 min-w-[12rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800/95 text-gray-300 shadow-lg backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in"
                      position="popper"
                      side="top"
                      sideOffset={5}
                    >
                      <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-gray-800/90 text-gray-400">
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </Select.ScrollUpButton>
                      <Select.Viewport className="p-1">
                        <Select.Group>
                          {MODELS.map((item) => (
                            <Select.Item
                              className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors hover:bg-gray-700/50 focus:bg-purple-700/20 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              key={item.value}
                              value={item.value}
                            >
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator className="absolute left-0 inline-flex w-8 items-center justify-center">
                                <Check className="h-4 w-4 text-purple-400" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Group>
                      </Select.Viewport>
                      <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-gray-800/90 text-gray-400">
                        <ChevronDown className="h-4 w-4" />
                      </Select.ScrollDownButton>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <button
                  className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-2 font-medium text-white shadow-md hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2"
                  disabled={disabled}
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
          </div>
        </fieldset>
      </form>
    </div>
  );
}
