import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json(null);
    return NextResponse.json({
      id: session.id,
      ragioneSociale: session.ragioneSociale,
      email: session.email,
    });
  } catch {
    return NextResponse.json(null);
  }
}
