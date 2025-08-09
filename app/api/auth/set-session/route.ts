import { cookies } from 'next/headers';

export const runtime = 'nodejs';

interface SetSessionBody {
  access_token: string;
  refresh_token: string;
  expires_at?: number; // seconds since epoch
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<SetSessionBody>;
  const accessToken = body.access_token ?? '';
  const refreshToken = body.refresh_token ?? '';
  const expiresAt = body.expires_at ?? undefined;

  if (!accessToken || !refreshToken) {
    return Response.json({ ok: false, error: 'Missing tokens' }, { status: 400 });
  }

  const cookieStore = await cookies();

  const secure = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    path: '/',
    secure,
  };

  const expires = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : undefined;

  cookieStore.set({ name: 'sb-access-token', value: accessToken, ...baseOptions, expires });
  cookieStore.set({ name: 'sb-refresh-token', value: refreshToken, ...baseOptions });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    path: '/',
    secure,
  };
  // Expire both cookies
  cookieStore.set({ name: 'sb-access-token', value: '', ...baseOptions, maxAge: 0 });
  cookieStore.set({ name: 'sb-refresh-token', value: '', ...baseOptions, maxAge: 0 });
  return Response.json({ ok: true });
}


