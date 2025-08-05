import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access a protected route, redirect to login
  if (!session && req.nextUrl.pathname.startsWith('/(main)')) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and trying to access login page, redirect to home
  if (session && req.nextUrl.pathname === '/login') {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
