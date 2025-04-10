"use client";

import ArrowRightIcon from "@/components/icons/arrow-right";
import Spinner from "@/components/spinner";
import assert from "assert";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createMessage } from "../../actions";
import { type Chat } from "./page";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check, Upload, XCircle, Image as ImageIcon } from "lucide-react";
import { MODELS } from "@/lib/constants";
import UploadIcon from "@/components/icons/upload-icon";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import * as Tooltip from '@radix-ui/react-tooltip';
import Image from 'next/image';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(chat.model || MODELS[0].value);
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const selectedModel = MODELS.find((m) => m.value === model);
  
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

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (prompt.length === 0) setPrompt(`Analyze this image and provide insights.`);
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

  return (
    <div className="mx-auto mb-5 flex w-full max-w-[calc(65ch+60px)] shrink-0 px-8">
      <form
        className="relative flex w-full"
        action={async () => {
          startTransition(async () => {
            // Include the screenshot URL in the message if available
            const messageText = screenshotUrl 
              ? `${prompt}\n\n[Image](${screenshotUrl})`
              : prompt;
              
            const message = await createMessage(chat.id, messageText, "user");
            const streamPromise = fetch(
              "/api/get-next-completion-stream-promise",
              {
                method: "POST",
                body: JSON.stringify({
                  messageId: message.id,
                  model: model,
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
              setScreenshotUrl(undefined);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            });
          });
        }}
      >
        <fieldset className="w-full" disabled={disabled}>
          <div className="relative flex flex-col rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm ml-[35px]">
            
            {/* Image Preview Pill Section */}
            <AnimatePresence>
              {screenshotUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: "8px" }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`px-3 ${isPending ? "invisible" : ""} overflow-hidden`}
                >
                  <Tooltip.Provider delayDuration={100}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="inline-flex items-center gap-2 rounded-full border border-purple-700/30 bg-gray-700/50 py-1 pl-1 pr-2 backdrop-blur-sm group relative">
                          <Image
                            alt="screenshot preview"
                            src={screenshotUrl}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-medium text-purple-300">Image</span>
                          <button
                            type="button"
                            className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/50 hover:text-white"
                            onClick={() => {
                              setScreenshotUrl(undefined);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            aria-label="Remove image"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content 
                          sideOffset={5}
                          className="z-50 rounded-md border border-gray-700 bg-gray-800/90 backdrop-blur-md shadow-lg p-1"
                          side="top"
                          align="start"
                        >
                          <Image
                            src={screenshotUrl} 
                            alt="Uploaded image preview" 
                            width={320}
                            height={192}
                            className="max-h-48 max-w-xs rounded object-contain"
                            style={{ objectFit: "contain", maxWidth: '20rem', maxHeight: '12rem' }}
                          />
                          <Tooltip.Arrow className="fill-gray-800/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea Section */}
            <div className="relative w-full">
              <div className="w-full p-3 pt-0">
                <p className="invisible min-h-[48px] w-full whitespace-pre-wrap text-white">
                  {textareaResizePrompt}
                </p>
              </div>
              <textarea
                ref={textareaRef}
                placeholder={screenshotUrl ? "Describe the image or ask a question..." : "Ask a follow-up question..."}
                autoFocus={!disabled}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                name="prompt"
                className={`peer absolute inset-0 w-full resize-none bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 ${screenshotUrl ? 'pt-12' : 'pt-3'}`}
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
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleScreenshotUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="pointer-events-none absolute inset-0 rounded-xl peer-focus:outline peer-focus:outline-offset-0 peer-focus:outline-purple-500" />

            <div className="flex items-center justify-between px-3 pb-2.5 pt-2">
              {/* Left-aligned button: Upload */}
              <button
                type="button"
                disabled={isPending || isStreaming || screenshotLoading}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-700/50 hover:text-gray-100 border border-gray-700/40 bg-gray-800/60 backdrop-blur-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 disabled:opacity-50 relative group"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload File"
                title="Upload File"
              >
                {screenshotLoading ? (
                  <Spinner className="h-3.5 w-3.5 text-purple-400" />
                ) : (
                  <UploadIcon className="h-3.5 w-3.5" />
                )}
                <span className="absolute bottom-full mb-1.5 left-0 px-2 py-1 text-xs text-gray-200 bg-gray-800/90 backdrop-blur-sm border border-gray-700/40 rounded shadow-sm opacity-0 invisible transition-all group-hover:opacity-100 group-hover:visible z-10">Upload File</span>
              </button>

              {/* Right-aligned buttons: Model Selector and Send */}
              <div className="flex items-center gap-2.5">
                <Select.Root
                  name="model"
                  value={model}
                  onValueChange={setModel}
                >
                  <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 border border-gray-700/40 bg-gray-800/60 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500">
                    <Select.Value aria-label={model}>
                      <span>{selectedModel?.label}</span>
                    </Select.Value>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      side="top"
                      sideOffset={5}
                      align="end"
                      className="z-50 max-h-96 min-w-[12rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800/95 backdrop-blur-sm text-gray-300 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    >
                      <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-gray-800/90 text-gray-400">
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </Select.ScrollUpButton>
                      <Select.Viewport className="p-1">
                        <Select.Group>
                          {MODELS.map((item) => (
                            <Select.Item
                              key={item.value}
                              value={item.value}
                              className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-purple-700/20 hover:bg-gray-700/50 focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
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
                  className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-4 py-2 font-medium text-white shadow-md hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                  type="submit"
                  disabled={disabled}
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
