/* eslint-disable @next/next/no-img-element */
"use client";

import { UserAuthNav } from "@/components/user-auth-nav";
import Fieldset from "@/components/fieldset";
import ArrowRightIcon from "@/components/icons/arrow-right";
import LightningBoltIcon from "@/components/icons/lightning-bolt";
import LoadingButton from "@/components/loading-button";
import Spinner from "@/components/spinner";
import * as Select from "@radix-ui/react-select";
import assert from "assert";
import { CheckIcon, ChevronDownIcon, Code, Layout, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState, useRef, useTransition, useEffect } from "react";
import { createChat } from "./actions";
import { Context } from "./providers";
import { supabase } from "@/lib/supabaseClient";
import UploadIcon from "@/components/icons/upload-icon";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { MODELS, SUGGESTED_PROMPTS } from "@/lib/constants";
import Spline from '@splinetool/react-spline';
import '@splinetool/runtime';

export default function Home() {
  const { setStreamPromise } = use(Context);
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [quality, setQuality] = useState("high");
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(
    undefined,
  );
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const selectedModel = MODELS.find((m) => m.value === model);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splineRef = useRef<any>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Log when the component mounts
    console.log("Component mounted, waiting for Spline to load");
    
    // Set a timeout to check if Spline loaded after 5 seconds
    const timer = setTimeout(() => {
      if (!splineLoaded) {
        console.log("Spline didn't load within timeout, forcing loaded state");
        setSplineLoaded(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [splineLoaded]);

  const onSplineLoad = (splineApp: any) => {
    console.log("Spline loaded successfully");
    setSplineLoaded(true);
    splineRef.current = splineApp;
  };

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (prompt.length === 0) setPrompt("Build this");
    setQuality("low");
    setScreenshotLoading(true);

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
        throw new Error("Could not get public URL for uploaded file.");
      }

      setScreenshotUrl(urlData.publicUrl);

    } catch (error) {
      console.error("Error uploading screenshot:", error);
      setScreenshotUrl(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setScreenshotLoading(false);
    }
  };

  const textareaResizePrompt = prompt
    .split("\n")
    .map((text) => (text === "" ? "a" : text))
    .join("\n");

  return (
    <div className="relative flex grow flex-col min-h-screen overflow-hidden">
      <div className="relative z-10 flex h-full grow flex-col">
        <div className="absolute top-0 right-0 p-4 z-20">
          <UserAuthNav />
        </div>
        
        <div className="mt-6 flex grow flex-col items-center px-4 mb-16 relative z-10">
          <div className="pt-2 pb-60 w-full">
            <h1 className="mt-4 text-balance text-center text-4xl leading-none text-white md:text-[64px] lg:mt-8">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                Design. Imagine. Chat. Launch
              </span>
              <br className="hidden md:block" /> 
              
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">WebSynx</span>
            </h1>
          </div>

          <p className="pt-6 mt-16 text-center text-lg text-gray-300 max-w-2xl">
          Describe your idea or upload a design — we'll build the website for you.
          </p>

          <form
            className="relative w-full max-w-2xl pt-2 lg:pt-4"
            action={async (formData) => {
              startTransition(async () => {
                const { prompt, model, quality } = Object.fromEntries(formData);

                assert.ok(typeof prompt === "string");
                assert.ok(typeof model === "string");
                assert.ok(quality === "high" || quality === "low");

                const { chatId, lastMessageId } = await createChat(
                  prompt,
                  model,
                  quality,
                  screenshotUrl,
                );

                const streamPromise = fetch(
                  "/api/get-next-completion-stream-promise",
                  {
                    method: "POST",
                    body: JSON.stringify({ messageId: lastMessageId, model }),
                  },
                ).then((res) => {
                  if (!res.body) {
                    throw new Error("No body on response");
                  }
                  return res.body;
                });

                startTransition(() => {
                  setStreamPromise(streamPromise);
                  router.push(`/chats/${chatId}`);
                });
              });
            }}
          >
            <Fieldset>
              <div className="relative flex w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm pb-12">
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
                  {screenshotUrl && (
                    <div
                      className={`${isPending ? "invisible" : ""} relative mx-3 mt-3`}
                    >
                      <div className="rounded-xl">
                        <img
                          alt="screenshot"
                          src={screenshotUrl}
                          className="group relative mb-2 h-16 w-[68px] rounded"
                        />
                      </div>
                      <button
                        type="button"
                        id="x-circle-icon"
                        className="absolute -right-3 -top-4 left-14 z-10 size-5 rounded-full bg-gray-800 text-gray-200 hover:text-gray-400"
                        onClick={() => {
                          setScreenshotUrl(undefined);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <XCircleIcon />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <div className="p-3">
                      <p className="invisible min-h-[48px] w-full whitespace-pre-wrap text-white">
                        {textareaResizePrompt}
                      </p>
                    </div>
                    <textarea
                      placeholder="Describe the website you want to create..."
                      required
                      name="prompt"
                      rows={1}
                      className="peer absolute inset-0 w-full resize-none bg-transparent p-3 text-white placeholder-gray-400 focus-visible:outline-none disabled:opacity-50"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
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
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select.Root
                      name="model"
                      value={model}
                      onValueChange={setModel}
                    >
                      <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                        <Select.Value aria-label={model}>
                          <span>{selectedModel?.label}</span>
                        </Select.Value>
                        <ChevronDownIcon className="h-4 w-4" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          position="popper"
                          className="z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800 text-gray-300 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                          <Select.Viewport className="p-1">
                            <Select.Group>
                              {MODELS.map((item) => (
                                <Select.Item
                                  key={item.value}
                                  value={item.value}
                                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-700 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                  <Select.ItemText>{item.label}</Select.ItemText>
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

                    <Select.Root
                      name="quality"
                      value={quality}
                      onValueChange={setQuality}
                    >
                      <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                        <Select.Value aria-label={quality}>
                          <span className="capitalize">{quality} Quality</span>
                        </Select.Value>
                        <ChevronDownIcon className="h-4 w-4" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          position="popper"
                          className="z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800 text-gray-300 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                          <Select.Viewport className="p-1">
                            <Select.Group>
                              <Select.Item
                                key="high"
                                value="high"
                                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-700 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <Select.ItemText>High Quality</Select.ItemText>
                                <Select.ItemIndicator className="absolute left-0 inline-flex w-8 items-center justify-center">
                                  <CheckIcon className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                              <Select.Item
                                key="low"
                                value="low"
                                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-700 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <Select.ItemText>Low Quality</Select.ItemText>
                                <Select.ItemIndicator className="absolute left-0 inline-flex w-8 items-center justify-center">
                                  <CheckIcon className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Group>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleScreenshotUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon className="h-4 w-4" />
                      <span>Upload</span>
                    </button>
                  </div>

                  <LoadingButton
                    type="submit"
                    className="flex items-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-md hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-50"
                    isLoading={isPending}
                    spinnerClassName="text-white"
                  >
                    <span>Create</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
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
                  key={promptObj.title}
                  type="button"
                  className="rounded-full bg-gray-800/50 backdrop-blur-sm border border-purple-700/20 px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-gray-100"
                  onClick={() => setPrompt(promptObj.description)}
                >
                  {promptObj.title}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-12 w-full pb-16 max-w-5xl">
            <h2 className="text-center text-2xl font-medium text-white mb-6">Website examples you can create</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-purple-500/10 flex items-center justify-center rounded-full mb-4">
                  <Layout className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Landing Pages</h3>
                <p className="text-gray-300">Create professional landing pages to convert visitors into customers with stunning designs.</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-pink-500/10 flex items-center justify-center rounded-full mb-4">
                  <Code className="w-6 h-6 text-pink-300" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Web Applications</h3>
                <p className="text-gray-300">Build interactive web applications with robust functionality and responsive interfaces.</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-indigo-500/10 flex items-center justify-center rounded-full mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Creative Portfolios</h3>
                <p className="text-gray-300">Showcase your work with unique portfolio websites that highlight your skills and achievements.</p>
              </div>
            </div>
          </div>
          
          {/* Tutorial Section */}
          <div className="mt-12 w-full pb-16 max-w-5xl">
            <h2 className="text-center text-2xl font-medium text-white mb-6">How to use WebSynx</h2>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/10 rounded-xl p-6 overflow-hidden">
              {/* Video container with 16:9 aspect ratio */}
              <div className="relative w-full pb-[56.25%] mb-6">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                  {/* Placeholder for the actual video */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-purple-500/20 flex items-center justify-center rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                    <p className="text-gray-300 max-w-md">Tutorial video coming soon! Learn how to create stunning websites with WebSynx in minutes.</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center rounded-full mb-3">
                    <span className="text-purple-300 font-medium">1</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Describe Your Idea</h3>
                  <p className="text-gray-300">Start by describing your website idea or upload a design mockup.</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-pink-500/10 flex items-center justify-center rounded-full mb-3">
                    <span className="text-pink-300 font-medium">2</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Generate Website</h3>
                  <p className="text-gray-300">Our AI will generate a complete website based on your description.</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center rounded-full mb-3">
                    <span className="text-indigo-300 font-medium">3</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Refine & Deploy</h3>
                  <p className="text-gray-300">Chat with our AI to refine your site and then deploy it with one click.</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
      {isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="rounded-lg bg-gray-800/90 border border-purple-700/15 p-6 shadow-xl">
            <LoadingMessage 
              isHighQuality={quality === "high"} 
              screenshotUrl={screenshotUrl} 
            />
            <div className="mt-4 flex justify-center">
              <Spinner className="size-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingMessage({
  isHighQuality,
  screenshotUrl,
}: {
  isHighQuality: boolean;
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
      {isHighQuality
        ? "Creating your website with high quality output. This might take a minute..."
        : "Creating your website with standard quality output. This should be quick..."}
    </p>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.582 0 0 3.672 0 8.203c0 3.623 2.292 6.699 5.471 7.783.4.075.546-.178.546-.396 0-.194-.007-.71-.01-1.394-2.226.495-2.696-1.1-2.696-1.1-.363-.948-.888-1.2-.888-1.2-.726-.508.055-.499.055-.499.803.058 1.225.845 1.225.845.714 1.253 1.873.891 2.328.682.074-.53.28-.891.509-1.096-1.776-.207-3.644-.911-3.644-4.054 0-.895.312-1.628.823-2.201-.082-.208-.357-1.042.079-2.17 0 0 .672-.222 2.2.84A7.485 7.485 0 018 3.967c.68.003 1.364.094 2.003.276 1.527-1.062 2.198-.841 2.198-.841.437 1.129.161 1.963.08 2.17.512.574.822 1.307.822 2.202 0 3.15-1.871 3.844-3.653 4.048.288.253.543.753.543 1.519 0 1.095-.01 1.98-.01 2.25 0 .219.144.474.55.394a8.031 8.031 0 003.96-2.989A8.337 8.337 0 0016 8.203C16 3.672 12.418 0 8 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export const runtime = "edge";
export const maxDuration = 45;
