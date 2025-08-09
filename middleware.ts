import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Pass-through middleware to avoid blocking Supabase client auth flows.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
