import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicPath = pathname === '/login';

  // Keep middleware extremely small for Vercel Edge size limits.
  // Infer authentication by presence of Supabase auth cookies.
  const accessToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('sb-refresh-token')?.value; // Supabase auth cookies
  const isAuthenticated = Boolean(accessToken);

  if (!isAuthenticated && !isPublicPath) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isPublicPath) {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
