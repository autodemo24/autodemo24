import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

const PROTECTED_ROUTES = ['/dashboard'];
const PUBLIC_AUTH_ROUTES = ['/login', '/registrati'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;
  const session = token ? await decrypt(token) : null;

  // Utente autenticato che tenta di accedere a /login o /registrati → redirect alla dashboard
  if (session && PUBLIC_AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Utente non autenticato che tenta di accedere a una rotta protetta → redirect al login
  if (!session && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/registrati'],
};
