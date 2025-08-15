/* eslint-disable @next/next/no-img-element */
'use client';

import { XCircleIcon } from '@heroicons/react/20/solid';
import * as Select from '@radix-ui/react-select';
import assert from 'assert';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Code,
  Layout,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState, useTransition } from 'react';
import Fieldset from '@/components/fieldset';
import ArrowRightIcon from '@/components/icons/arrow-right';
import LightningBoltIcon from '@/components/icons/lightning-bolt';
import UploadIcon from '@/components/icons/upload-icon';
import LoadingButton from '@/components/loading-button';
import Spinner from '@/components/spinner';
import { UserAuthNav } from '@/components/user-auth-nav';
import { MODELS, SUGGESTED_PROMPTS } from '@/lib/constants';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { createChat } from './actions';
import { Context } from './providers';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import type { DragEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CreateChatResult } from './actions';

export default function Home() {
  const { setStreamPromise } = use(Context);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const supabase = getBrowserSupabase();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODELS[0].value);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const selectedModel = MODELS.find((m) => m.value === model);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splineRef = useRef<any>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isPending, startTransition] = useTransition();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Log when the component mounts
    console.log('Component mounted, waiting for Spline to load');

    // Set a timeout to check if Spline loaded after 5 seconds
    const timer = setTimeout(() => {
      if (!splineLoaded) {
        console.log("Spline didn't load within timeout, forcing loaded state");
        setSplineLoaded(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [splineLoaded]);

  useEffect(() => {
    if (pathname === '/' && promptTextareaRef.current) {
      console.log('Home page: Pathname is /, focusing prompt input.');
      promptTextareaRef.current.focus();
    }
  }, [pathname]);

  const onSplineLoad = (splineApp: any) => {
    console.log('Spline loaded successfully');
    splineRef.current = splineApp;
  };

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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
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

  // Handle drag and drop events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(screenshotLoading || isPending)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the mouse is leaving the drop zone element entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(screenshotLoading || isPending)) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (screenshotLoading || isPending) return;

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

  // Function to remove a specific image URL
  const removeScreenshotUrl = (urlToRemove: string) => {
    setScreenshotUrls((prevUrls) =>
      prevUrls.filter((url) => url !== urlToRemove)
    );
    if (
      screenshotUrls.length === 1 &&
      prompt === 'Analyze these images and provide insights.'
    ) {
      setPrompt(''); // Clear default prompt if last image removed
    }
  };

  const textareaResizePrompt = prompt
    .split('\n')
    .map((text) => (text === '' ? 'a' : text))
    .join('\n');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="relative flex min-h-screen grow flex-col overflow-hidden scroll-smooth">
      <div className="relative z-10 flex h-full grow flex-col">
        <div className="absolute top-0 right-0 z-20 p-4">
          <UserAuthNav />
        </div>

        <div className="relative z-10 mt-6 mb-16 flex grow flex-col items-center px-4">
          <div className="w-full pt-2 pb-60">
            <h1 className="mt-4 text-balance text-center text-4xl text-white leading-none md:text-[64px] lg:mt-8">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                Design. Imagine. Chat. Launch
              </span>
              <br className="hidden md:block" />

              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                WebSynx
              </span>
            </h1>
          </div>

          <p className="mt-16 max-w-2xl pt-6 text-center text-gray-300 text-lg">
            Describe your idea or upload a design — we&apos;ll build the website
            for you.
          </p>

          <form
            action={async (formData) => {
              startTransition(async () => {
                const { prompt, model } = Object.fromEntries(formData);

                assert.ok(typeof prompt === 'string');
                assert.ok(typeof model === 'string');

                // Send only the first screenshot URL, if available
                const firstScreenshotUrl =
                  screenshotUrls.length > 0 ? screenshotUrls[0] : undefined;

                try {
                  const result = (await createChat(
                    prompt,
                    model,
                    firstScreenshotUrl
                  )) as CreateChatResult;

                  if (!result.ok) {
                    if (result.code === 'TRIAL_EXHAUSTED') {
                      toast({
                        title: 'Free trial used',
                        description:
                          'Add your Together API key in Settings to continue creating chats without limits.',
                      });
                      router.push('/settings');
                      return;
                    }
                    if (result.code === 'AUTH_REQUIRED') {
                      router.push('/login');
                      return;
                    }
                    toast({ title: 'Unable to create chat', description: result.message || result.code });
                    return;
                  }

                  const { chatId, lastMessageId } = result;
                  if (!chatId || !lastMessageId) {
                    toast({ title: 'Unable to create chat', description: 'Missing chat identifiers.' });
                    return;
                  }

                  const streamPromise = fetch(
                    '/api/get-next-completion-stream-promise',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ messageId: lastMessageId, model }),
                    }
                  ).then((res) => {
                    if (!res.body) {
                      throw new Error('No body on response');
                    }
                    return res;
                  });

                  startTransition(() => {
                    setStreamPromise(streamPromise);
                    router.push(`/chats/${chatId}`);
                  });
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err);
                  toast({ title: 'Something went wrong', description: msg });
                }
              });
            }}
            className="relative w-full max-w-2xl pt-2 lg:pt-4"
          >
            <Fieldset>
              <div
                className={`relative flex w-full max-w-2xl rounded-xl border ${isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50'} pb-12 backdrop-blur-sm transition-colors`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <UploadIcon className="h-8 w-8 text-purple-400" />
                      <p className="text-gray-200 text-sm">
                        Drop your image(s) here
                      </p>
                    </div>
                  </div>
                )}
                <div className="w-full">
                  {screenshotLoading && (
                    <div className="relative mx-3 mt-3">
                      <div className="rounded-xl">
                        <div className="group mb-2 flex h-16 w-[68px] animate-pulse items-center justify-center rounded bg-gray-700">
                          <Spinner />
                        </div>
                      </div>
                    </div>
                  )}
                  {screenshotUrls.length > 0 && (
                    <div
                      className={`${isPending ? 'invisible' : ''} relative mx-3 mt-3 flex flex-wrap gap-2`}
                    >
                      {screenshotUrls.map((url, index) => (
                        <div className="group relative" key={url}>
                          <img
                            alt={`screenshot ${index + 1}`}
                            className="h-16 w-[68px] rounded object-cover"
                            src={url}
                          />
                          <button
                            aria-label={`Remove image ${index + 1}`}
                            className="-right-1 -top-1 absolute z-10 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-gray-300 opacity-0 transition-opacity hover:bg-red-500/50 hover:text-white group-hover:opacity-100"
                            onClick={() => removeScreenshotUrl(url)}
                            type="button"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <div className="p-3">
                      <p className="invisible min-h-[48px] w-full whitespace-pre-wrap text-white">
                        {textareaResizePrompt}
                      </p>
                    </div>
                    <textarea
                      className="peer absolute inset-0 w-full resize-none bg-transparent p-3 text-white placeholder-gray-400 focus-visible:outline-none disabled:opacity-50"
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
                      placeholder="Describe the website you want to create..."
                      ref={promptTextareaRef}
                      required
                      rows={1}
                      value={prompt}
                    />
                  </div>
                </div>
                <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select.Root
                      name="model"
                      onValueChange={setModel}
                      value={model}
                    >
                      <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1 text-gray-300 text-sm hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                        <Select.Value aria-label={model}>
                          <span>{selectedModel?.label}</span>
                        </Select.Value>
                        <ChevronDownIcon className="h-4 w-4" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800 text-gray-300 shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in"
                          position="popper"
                        >
                          <Select.Viewport className="p-1">
                            <Select.Group>
                              {MODELS.map((item) => (
                                <Select.Item
                                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-gray-700 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                  key={item.value}
                                  value={item.value}
                                >
                                  <Select.ItemText>
                                    {item.label}
                                  </Select.ItemText>
                                  <Select.ItemIndicator className="absolute left-0 inline-flex w-8 items-center justify-center">
                                    <CheckIcon className="h-4 w-4" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Group>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    <input
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={handleFileInputChange}
                      ref={fileInputRef}
                      type="file"
                    />
                    <button
                      className="inline-flex items-center gap-1 rounded-md p-1 text-gray-300 text-sm hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50"
                      disabled={isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                      type="button"
                    >
                      <UploadIcon className="h-4 w-4" />
                      <span>Upload</span>
                    </button>
                  </div>

                  <LoadingButton
                    className="flex items-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-2 font-medium text-sm text-white shadow-md hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2 disabled:opacity-50"
                    isLoading={isPending}
                    spinnerClassName="text-white"
                    type="submit"
                  >
                    <span>Create</span>
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </LoadingButton>
                </div>
              </div>
            </Fieldset>
          </form>
          {/* Example prompts */}
          <div className="mt-6 mb-8 w-full max-w-2xl">
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTED_PROMPTS.map((promptObj) => (
                <button
                  className="rounded-full border border-purple-700/20 bg-gray-800/50 px-4 py-2 text-gray-300 text-sm backdrop-blur-sm hover:bg-purple-900/20 hover:text-gray-100"
                  key={promptObj.title}
                  onClick={() => setPrompt(promptObj.description)}
                  type="button"
                >
                  {promptObj.title}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-12 w-full max-w-5xl pb-16">
            <h2 className="mb-6 text-center font-medium text-2xl text-white">
              Website examples you can create
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-purple-700/10 bg-gray-800/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <Layout className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="mb-2 font-medium text-white text-xl">
                  Landing Pages
                </h3>
                <p className="text-gray-300">
                  Create professional landing pages to convert visitors into
                  customers with stunning designs.
                </p>
              </div>

              <div className="rounded-xl border border-purple-700/10 bg-gray-800/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10">
                  <Code className="h-6 w-6 text-pink-300" />
                </div>
                <h3 className="mb-2 font-medium text-white text-xl">
                  Web Applications
                </h3>
                <p className="text-gray-300">
                  Build interactive web applications with robust functionality
                  and responsive interfaces.
                </p>
              </div>

              <div className="rounded-xl border border-purple-700/10 bg-gray-800/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
                  <Sparkles className="h-6 w-6 text-indigo-300" />
                </div>
                <h3 className="mb-2 font-medium text-white text-xl">
                  Creative Portfolios
                </h3>
                <p className="text-gray-300">
                  Showcase your work with unique portfolio websites that
                  highlight your skills and achievements.
                </p>
              </div>
            </div>
          </div>

          {/* Tutorial Section */}
          <div className="mt-12 w-full max-w-5xl pb-16">
            <h2 className="mb-6 text-center font-medium text-2xl text-white">
              How to use WebSynx
            </h2>

            <div className="overflow-hidden rounded-xl border border-purple-700/10 bg-gray-800/50 p-6 backdrop-blur-sm">
              {/* Video container with 16:9 aspect ratio */}
              <div className="relative mb-6 w-full pb-[56.25%]">
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900">
                  {/* Placeholder for the actual video */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
                      <svg
                        className="text-purple-300"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="max-w-md text-gray-300">
                      Tutorial video coming soon! Learn how to create stunning
                      websites with WebSynx in minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                    <span className="font-medium text-purple-300">1</span>
                  </div>
                  <h3 className="mb-2 font-medium text-lg text-white">
                    Describe Your Idea
                  </h3>
                  <p className="text-gray-300">
                    Start by describing your website idea or upload a design
                    mockup.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10">
                    <span className="font-medium text-pink-300">2</span>
                  </div>
                  <h3 className="mb-2 font-medium text-lg text-white">
                    Generate Website
                  </h3>
                  <p className="text-gray-300">
                    Our AI will generate a complete website based on your
                    description.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                    <span className="font-medium text-indigo-300">3</span>
                  </div>
                  <h3 className="mb-2 font-medium text-lg text-white">
                    Refine & Deploy
                  </h3>
                  <p className="text-gray-300">
                    Chat with our AI to refine your site and then deploy it with
                    one click.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 w-full max-w-5xl pb-16">
            <h2 className="mb-6 text-center font-medium text-2xl text-white">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {/* FAQ Item 1 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    How does WebSynx create websites?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  WebSynx uses AI to understand your description and generates a
                  complete website structure, design, and content. It&apos;s
                  like having a team of web developers and designers at your
                  fingertips, ready to build your vision in minutes.
                </div>
              </div>

              {/* FAQ Item 2 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    Do I need technical knowledge to use WebSynx?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  Not at all! WebSynx is designed for users with any level of
                  technical expertise. Simply describe what you want, and our AI
                  generates the website for you. You can make adjustments
                  through natural conversation without writing a single line of
                  code.
                </div>
              </div>

              {/* FAQ Item 3 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    What types of websites can I create?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  You can create a wide variety of websites including landing
                  pages, e-commerce sites, portfolios, blogs, business websites,
                  web applications, and more. If you can describe it, WebSynx
                  can build it.
                </div>
              </div>

              {/* FAQ Item 4 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    How do I deploy my website once it&apos;s created?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  Once your website is generated, you can deploy it with a
                  single click to our hosting platform. Alternatively, you can
                  download the source code to host it on your preferred platform
                  like Vercel, Netlify, or your own server.
                </div>
              </div>

              {/* FAQ Item 5 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    Can I customize the website after it&apos;s generated?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  Absolutely! After generation, you can continue chatting with
                  our AI to refine and modify any aspect of your website. You
                  can request changes to layout, colors, content, functionality,
                  and more through simple text instructions.
                </div>
              </div>

              {/* FAQ Item 6 */}
              <div className="group rounded-xl border border-purple-700/10 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/70">
                <div className="flex w-full items-center justify-between text-left">
                  <h3 className="font-medium text-lg text-white">
                    Can I upload my own design mockups?
                  </h3>
                  <div className="rounded-full bg-gray-700/50 p-1">
                    <ChevronDownIcon className="h-5 w-5 text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
                  </div>
                </div>
                <div className="mt-0 max-h-0 overflow-hidden text-gray-300 text-sm transition-all duration-700 ease-in-out group-hover:mt-2 group-hover:max-h-40">
                  Yes! WebSynx can analyze your uploaded design mockups and
                  convert them into fully functional websites. Simply upload
                  your image through the interface, and our AI will transform it
                  into a working website that matches your design.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg border border-purple-700/15 bg-gray-800/90 p-6 shadow-xl">
            <LoadingMessage screenshotUrl={
                screenshotUrls.length > 0 ? screenshotUrls[0] : undefined
              }
            />
            <div className="mt-4 flex justify-center">
              <Spinner className="size-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto w-full border-purple-700/10 border-t bg-gray-900/40 py-6 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center">
              <div className="mr-2 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text font-semibold text-transparent text-xl">
                WebSynx
              </div>
              <span className="text-gray-400 text-sm">
                © {new Date().getFullYear()}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <a
                className="transition-colors duration-300 hover:text-white"
                href="#"
              >
                Terms
              </a>
              <a
                className="transition-colors duration-300 hover:text-white"
                href="#"
              >
                Privacy
              </a>
              <a
                className="transition-colors duration-300 hover:text-white"
                href="#"
              >
                About
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <a
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-all duration-300 hover:bg-purple-900/30 hover:text-white"
                href="#"
              >
                <svg
                  className=""
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-all duration-300 hover:bg-purple-900/30 hover:text-white"
                href="#"
              >
                <svg
                  className=""
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-all duration-300 hover:bg-purple-900/30 hover:text-white"
                href="#"
              >
                <svg
                  className=""
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-all duration-300 hover:bg-purple-900/30 hover:text-white"
                href="https://github.com"
              >
                <GithubIcon className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingMessage({
  screenshotUrl,
}: {
  screenshotUrl: string | undefined;
}) {
  if (screenshotUrl) {
    return (
      <p className="mt-4 text-center text-base text-gray-400">
        Converting your screenshot into a website...
      </p>
    );
  }

  return (
    <p className="mt-4 text-center text-base text-gray-400">
      Creating your website. This might take a minute...
    </p>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      height={16}
      viewBox="0 0 16 16"
      width={16}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M8 0C3.582 0 0 3.672 0 8.203c0 3.623 2.292 6.699 5.471 7.783.4.075.546-.178.546-.396 0-.194-.007-.71-.01-1.394-2.226.495-2.696-1.1-2.696-1.1-.363-.948-.888-1.2-.888-1.2-.726-.508.055-.499.055-.499.803.058 1.225.845 1.225.845.714 1.253 1.873.891 2.328.682.074-.53.28-.891.509-1.096-1.776-.207-3.644-.911-3.644-4.054 0-.895.312-1.628.823-2.201-.082-.208-.357-1.042.079-2.17 0 0 .672-.222 2.2.84A7.485 7.485 0 018 3.967c.68.003 1.364.094 2.003.276 1.527-1.062 2.198-.841 2.198-.841.437 1.129.161 1.963.08 2.17.512.574.822 1.307.822 2.202 0 3.15-1.871 3.844-3.653 4.048.288.253.543.753.543 1.519 0 1.095-.01 1.98-.01 2.25 0 .219.144.474.55.394a8.031 8.031 0 003.96-2.989A8.337 8.337 0 0016 8.203C16 3.672 12.418 0 8 0z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

// Use default (Node.js) runtime to keep the server bundle small for Vercel free plan limits
