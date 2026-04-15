import { NextResponse } from 'next/server';

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function GET() {
  return NextResponse.redirect(appUrl('/dashboard/ebay?declined=1'));
}
