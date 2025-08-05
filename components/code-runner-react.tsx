'use client';

import {
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react/unstyled';
import dedent from 'dedent';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import * as shadcnComponents from '@/lib/shadcn';

export default function ReactCodeRunner({
  code,
  onRequestFix,
}: {
  code: string;
  onRequestFix?: (e: string) => void;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
      <SandpackProvider
        className="relative h-full w-full [&_.sp-preview-container]:flex [&_.sp-preview-container]:h-full [&_.sp-preview-container]:w-full [&_.sp-preview-container]:grow [&_.sp-preview-container]:flex-col [&_.sp-preview-container]:justify-center [&_.sp-preview-container]:rounded-xl [&_.sp-preview-container]:bg-transparent [&_.sp-preview-container]:backdrop-blur-sm [&_.sp-preview-iframe]:grow [&_.sp-preview-iframe]:bg-transparent"
        customSetup={{
          dependencies,
        }}
        files={{
          'App.tsx': code,
          ...shadcnFiles,
          '/tsconfig.json': {
            code: `{
              "include": [
                "./**/*"
              ],
              "compilerOptions": {
                "strict": true,
                "esModuleInterop": true,
                "lib": [ "dom", "es2015" ],
                "jsx": "react-jsx",
                "baseUrl": "./",
                "paths": {
                  "@/components/*": ["components/*"]
                }
              }
            }
          `,
          },
        }}
        key={code}
        options={{
          externalResources: [
            'https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css',
          ],
        }}
        template="react-ts"
      >
        <SandpackPreview
          className="h-full w-full"
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showOpenNewtab={false}
          showRefreshButton={false}
          showRestartButton={false}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
          }}
        />
        {onRequestFix && <ErrorMessage onRequestFix={onRequestFix} />}
      </SandpackProvider>
    </div>
  );
}

function ErrorMessage({ onRequestFix }: { onRequestFix: (e: string) => void }) {
  const { sandpack } = useSandpack();
  const [didCopy, setDidCopy] = useState(false);

  if (!sandpack.error) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 text-base backdrop-blur-sm">
      <div className="max-w-[400px] rounded-md border border-red-500/50 bg-gray-900 p-4 text-white shadow-black/20 shadow-xl">
        <p className="font-medium text-lg text-red-400">Error</p>

        <p className="mt-4 line-clamp-[10] overflow-x-auto whitespace-pre font-mono text-gray-300 text-xs">
          {sandpack.error.message}
        </p>

        <div className="mt-8 flex justify-between gap-4">
          <button
            className="rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 font-semibold text-gray-300 text-sm hover:bg-gray-700"
            onClick={async () => {
              if (!sandpack.error) return;

              setDidCopy(true);
              await window.navigator.clipboard.writeText(
                sandpack.error.message
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));
              setDidCopy(false);
            }}
          >
            {didCopy ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </button>
          <button
            className="rounded bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 px-3 py-1.5 font-medium text-sm text-white hover:opacity-90"
            onClick={() => {
              if (!sandpack.error) return;
              onRequestFix(sandpack.error.message);
            }}
          >
            Try to fix
          </button>
        </div>
      </div>
    </div>
  );
}

const shadcnFiles = {
  '/lib/utils.ts': shadcnComponents.utils,
  '/components/ui/accordion.tsx': shadcnComponents.accordian,
  '/components/ui/alert-dialog.tsx': shadcnComponents.alertDialog,
  '/components/ui/alert.tsx': shadcnComponents.alert,
  '/components/ui/avatar.tsx': shadcnComponents.avatar,
  '/components/ui/badge.tsx': shadcnComponents.badge,
  '/components/ui/breadcrumb.tsx': shadcnComponents.breadcrumb,
  '/components/ui/button.tsx': shadcnComponents.button,
  '/components/ui/calendar.tsx': shadcnComponents.calendar,
  '/components/ui/card.tsx': shadcnComponents.card,
  '/components/ui/carousel.tsx': shadcnComponents.carousel,
  '/components/ui/checkbox.tsx': shadcnComponents.checkbox,
  '/components/ui/collapsible.tsx': shadcnComponents.collapsible,
  '/components/ui/dialog.tsx': shadcnComponents.dialog,
  '/components/ui/drawer.tsx': shadcnComponents.drawer,
  '/components/ui/dropdown-menu.tsx': shadcnComponents.dropdownMenu,
  '/components/ui/input.tsx': shadcnComponents.input,
  '/components/ui/label.tsx': shadcnComponents.label,
  '/components/ui/menubar.tsx': shadcnComponents.menuBar,
  '/components/ui/navigation-menu.tsx': shadcnComponents.navigationMenu,
  '/components/ui/pagination.tsx': shadcnComponents.pagination,
  '/components/ui/popover.tsx': shadcnComponents.popover,
  '/components/ui/progress.tsx': shadcnComponents.progress,
  '/components/ui/radio-group.tsx': shadcnComponents.radioGroup,
  '/components/ui/select.tsx': shadcnComponents.select,
  '/components/ui/separator.tsx': shadcnComponents.separator,
  '/components/ui/skeleton.tsx': shadcnComponents.skeleton,
  '/components/ui/slider.tsx': shadcnComponents.slider,
  '/components/ui/switch.tsx': shadcnComponents.switchComponent,
  '/components/ui/table.tsx': shadcnComponents.table,
  '/components/ui/tabs.tsx': shadcnComponents.tabs,
  '/components/ui/textarea.tsx': shadcnComponents.textarea,
  '/components/ui/toast.tsx': shadcnComponents.toast,
  '/components/ui/toaster.tsx': shadcnComponents.toaster,
  '/components/ui/toggle-group.tsx': shadcnComponents.toggleGroup,
  '/components/ui/toggle.tsx': shadcnComponents.toggle,
  '/components/ui/tooltip.tsx': shadcnComponents.tooltip,
  '/components/ui/use-toast.tsx': shadcnComponents.useToast,
  '/components/ui/index.tsx': `
  export * from "./button"
  export * from "./card"
  export * from "./input"
  export * from "./label"
  export * from "./select"
  export * from "./textarea"
  export * from "./avatar"
  export * from "./radio-group"
  `,
  '/public/index.html': dedent`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `,
};

const dependencies = {
  'lucide-react': 'latest',
  recharts: '2.9.0',
  'react-router-dom': 'latest',
  '@radix-ui/react-accordion': '^1.2.0',
  '@radix-ui/react-alert-dialog': '^1.1.1',
  '@radix-ui/react-aspect-ratio': '^1.1.0',
  '@radix-ui/react-avatar': '^1.1.0',
  '@radix-ui/react-checkbox': '^1.1.1',
  '@radix-ui/react-collapsible': '^1.1.0',
  '@radix-ui/react-dialog': '^1.1.1',
  '@radix-ui/react-dropdown-menu': '^2.1.1',
  '@radix-ui/react-hover-card': '^1.1.1',
  '@radix-ui/react-label': '^2.1.0',
  '@radix-ui/react-menubar': '^1.1.1',
  '@radix-ui/react-navigation-menu': '^1.2.0',
  '@radix-ui/react-popover': '^1.1.1',
  '@radix-ui/react-progress': '^1.1.0',
  '@radix-ui/react-radio-group': '^1.2.0',
  '@radix-ui/react-select': '^2.1.1',
  '@radix-ui/react-separator': '^1.1.0',
  '@radix-ui/react-slider': '^1.2.0',
  '@radix-ui/react-slot': '^1.1.0',
  '@radix-ui/react-switch': '^1.1.0',
  '@radix-ui/react-tabs': '^1.1.0',
  '@radix-ui/react-toast': '^1.2.1',
  '@radix-ui/react-toggle': '^1.1.0',
  '@radix-ui/react-toggle-group': '^1.1.0',
  '@radix-ui/react-tooltip': '^1.1.2',
  'class-variance-authority': '^0.7.0',
  clsx: '^2.1.1',
  'date-fns': '^3.6.0',
  'embla-carousel-react': '^8.1.8',
  'react-day-picker': '^8.10.1',
  'tailwind-merge': '^2.4.0',
  'tailwindcss-animate': '^1.0.7',
  'framer-motion': '^11.15.0',
  vaul: '^0.9.1',
};
