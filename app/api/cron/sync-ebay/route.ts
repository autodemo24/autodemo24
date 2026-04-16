import { NextResponse } from 'next/server';
import { syncAllListings } from '../../../../lib/ebay/sync';

// Vercel Cron Job: sincronizza TUTTI i listing attivi di TUTTI i demolitori.
// Chiamato da Vercel con header Authorization: Bearer $CRON_SECRET.
// Schedule in vercel.json.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAllListings();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
