## WebSynx

An AI-powered website builder and coding chat. Describe what you want or upload a design screenshot and WebSynx will generate a working app, show you the code, and let you iterate in a live preview — all in one chat.

### Highlights
- **Prompt or Screenshot to Site**: Drag-and-drop images or type a prompt; WebSynx converts them into code.
- **Streaming Responses**: See code and preview stream in real time.
- **Code Viewer + Runner**: Inspect, copy, and run code with an inline preview.
- **Chat Versions**: Navigate earlier AI responses and compare.
- **Auth & Persistence**: Supabase Auth, Realtime chat history, public storage for screenshots.
- **Strict Quality**: React 19, Next.js 15 App Router, TailwindCSS, shadcn/ui, and Biome via Ultracite.

### Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: TailwindCSS, `tailwindcss-animate`, custom fonts
- **UI**: shadcn/ui primitives (see `lib/shadcn-docs`), Radix UI
- **State/Utilities**: Context, `use-stick-to-bottom`, Framer Motion
- **Auth/DB/Storage**: Supabase (Auth, Postgres, Realtime, Storage)
- **AI**: Together AI (chat.completions, optional Helicone proxy)
- **DX**: Ultracite (Biome) for lint/format; TypeScript strict

## Getting Started

### Prerequisites
- Node.js 20+ or Bun 1.1+
- A Supabase project (URL, anon key, service role key)
- A 32-byte base64 secret for encrypting personal API keys

### 1) Clone and install

```bash
git clone https://github.com/your-org/websynx.git
cd websynx

# Using Bun (recommended)
bun install

# or using npm
npm install
```

### 2) Environment variables
Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # server-only

# Together / Helicone (optional, server-side)
# If you proxy via Helicone, set this to enable special baseURL/headers
HELICONE_API_KEY=

# Personal key encryption (server-only)
# Must be a base64-encoded 32-byte key. Example to generate:
# openssl rand -base64 32
PERSONAL_KEY_SECRET=base64_32_byte_secret

# Deployment domain resolution (see lib/domain.ts)
NEXT_PUBLIC_VERCEL_ENV=development
NEXT_PUBLIC_VERCEL_URL=
VERCEL_BRANCH_URL=
NEXT_PUBLIC_DEVELOPMENT_URL=http://localhost:3000
```

Notes:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- `PERSONAL_KEY_SECRET` is required to encrypt/decrypt user-supplied Together API keys stored in the DB.

### 3) Supabase setup

Create the following tables and a public storage bucket named `screenshots` (public read). Minimal schema used by the app:

```sql
-- chats: one row per conversation
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  model text not null,
  prompt text not null,
  title text default '' not null,
  shadcn boolean default true not null,
  websynxVersion text default 'v2' not null,
  created_at timestamp with time zone default now() not null
);

-- messages: ordered messages per chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text check (role in ('system','user','assistant')) not null,
  content text not null,
  position integer not null,
  created_at timestamp with time zone default now() not null
);

-- user_secrets: stores encrypted personal Together API keys
create table if not exists public.user_secrets (
  user_id uuid primary key,
  together_api_key_ciphertext text not null
);

-- recommended indexes
create index if not exists messages_chat_id_position_idx on public.messages(chat_id, position);
create index if not exists chats_user_id_created_at_idx on public.chats(user_id, created_at desc);
```

Row Level Security (RLS) guidelines (write policies to fit your needs):
- `chats`: owners can select/insert/update/delete their chats; anonymous (no user) can only see null `user_id` rows when allowed.
- `messages`: same owner policy via parent `chat_id` relationship.
- `user_secrets`: only the owner can `select/insert/update/delete` their row.

Storage:
- Create a bucket `screenshots` and enable public reads. The app uploads under `public/` and uses `getPublicUrl`.

### 4) Run the app

```bash
# Development
bun run dev
# or
npm run dev

# Build & start
bun run build && bun run start
# or
npm run build && npm run start

# Lint & format (Ultracite / Biome)
bun run lint
bun run format
```

Open `http://localhost:3000` and sign in via the email/password form. Middleware enforces auth for all routes except `/login`.

## How it works

### User flow
1. Home page (`app/(main)/page.tsx`): choose a model, enter a prompt, optionally upload images. On submit, a server action creates a chat and initial messages.
2. Chat page (`app/(main)/chats/[id]`): streams the next assistant response via `/api/get-next-completion-stream-promise` and renders the code/preview in the right panel.
3. Sidebar (`components/sidebar`): shows your chat history with Supabase Realtime updates.

### Key modules
- `app/(main)/actions.ts`: server actions for creating chats/messages, managing user keys, and updating titles. Integrates with Together AI and prompts in `lib/prompts.ts`.
- `app/api/get-next-completion-stream-promise/route.ts`: server route that assembles message history and streams Together AI responses.
- `app/(main)/chats/[id]/*`: chat UI (log, input box, code viewer, layout, share, error boundary).
- `lib/supabase-*`: server/client Supabase helpers. Admin client used for special tasks only.
- `lib/crypto.ts`: AES-GCM encryption/decryption using `PERSONAL_KEY_SECRET`.
- `lib/constants.ts`: model list and example prompts.
- `middleware.ts`: protects routes, redirecting unauthenticated users to `/login`.

### Architectural notes
- Client components handle UI, inputs, and uploads. All DB and AI calls run in server actions or API routes.
- Streaming is handled with Together's `ChatCompletionStream` and rendered incrementally in the chat + code viewer.
- The first code fence in an assistant message is parsed to power preview/runner (see `lib/utils.ts`).

## Environment reference

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required client configuration.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only admin operations.
- `PERSONAL_KEY_SECRET`: base64 32-byte key for encrypting user secrets.
- `HELICONE_API_KEY` (optional): enables Helicone proxy headers/baseURL for Together AI calls.
- `NEXT_PUBLIC_DEVELOPMENT_URL`, `NEXT_PUBLIC_VERCEL_URL`, `VERCEL_BRANCH_URL`, `NEXT_PUBLIC_VERCEL_ENV`: domain resolution for OG/image URLs and links (see `lib/domain.ts`).

## Deployment

- Deploy on Vercel; set the same environment variables there.
- Ensure `screenshots` bucket exists and public.
- Confirm RLS policies align with your auth requirements.
- Production URL is resolved in `lib/domain.ts` (prefers `https://websynx.ai` when `NEXT_PUBLIC_VERCEL_ENV=production`).

## Quality, a11y, and linting

- This repo uses Ultracite (Biome) for consistent formatting, linting, and accessibility-friendly patterns.
- Commands: `bun run lint`, `bun run format`.
- General principles: strict TypeScript, avoid unused code, keep client/server responsibilities clear.

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Generate a strong `PERSONAL_KEY_SECRET`:

```bash
openssl rand -base64 32
```

- `user_secrets.together_api_key_ciphertext` is stored encrypted; decrypted only server-side for Together calls.

## Troubleshooting

- Auth redirect loop: validate Supabase URL/keys and cookie domain; ensure middleware includes your paths.
- Rate limits: Together/Supabase may throttle; transient errors in console are suppressed by the provider to reduce noise.
- Image uploads failing: check `screenshots` bucket exists, is public, and CORS/storage policies allow uploads.

## License

Add your license here (e.g., MIT). If omitted, usage is restricted.

## Acknowledgements

- Together AI for powerful model access
- Supabase for Auth, DB, Realtime, and Storage
- shadcn/ui and Radix for accessible UI primitives


