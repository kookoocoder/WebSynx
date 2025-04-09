"use client";

import { use } from "react";
import { createHighlighter } from "shiki/bundle/web";

const highlighterPromise = createHighlighter({
  langs: [
    "html",
    "css",
    "js",
    "graphql",
    "javascript",
    "json",
    "jsx",
    "markdown",
    "md",
    "mdx",
    "plaintext",
    "py",
    "python",
    "sh",
    "shell",
    "sql",
    "text",
    "ts",
    "tsx",
    "txt",
    "typescript",
    "zsh",
  ],
  themes: ["github-dark-dimmed", "github-dark"],
});

export default function SyntaxHighlighter({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const highlighter = use(highlighterPromise);
  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme: "github-dark-dimmed",
  });

  return (
    <div 
      className="p-4 text-sm bg-gray-900 scrollbar-hide" 
      dangerouslySetInnerHTML={{ 
        __html: html.replace(
          '<pre class="shiki github-dark-dimmed"',
          '<pre class="shiki github-dark-dimmed scrollbar-hide" style="background: transparent; border-radius: 0.5rem; color: #adbac7;"'
        ) 
      }} 
    />
  );
}
