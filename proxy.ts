import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

const PROTECTED_ROUTES = ['/dashboard'];
const PUBLIC_AUTH_ROUTES = ['/login', '/registrati'];

// Rebrand autodemo24 → autigo: 301 redirect dal vecchio dominio + forza no-www
const PRIMARY_HOST = 'autigo.it';
const LEGACY_HOSTS = new Set([
  'www.autigo.it',
  'autodemo24.it',
  'www.autodemo24.it',
]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? '';

  // Redirect legacy hosts → autigo.it (preserva path + query)
  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.host = PRIMARY_HOST;
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|api/ebay/notifications|api/ebay/deletion-notification).*)',
  ],
};
