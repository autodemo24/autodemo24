import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Redirect www.autigo.it, autodemo24.it, www.autodemo24.it → autigo.it
const PRIMARY_HOST = 'autigo.it';
const LEGACY_HOSTS = new Set([
  'www.autigo.it',
  'autodemo24.it',
  'www.autodemo24.it',
]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host')?.toLowerCase() ?? '';

  if (LEGACY_HOSTS.has(host)) {
    url.host = PRIMARY_HOST;
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|api/ebay/notifications|api/ebay/deletion-notification).*)'],
};
