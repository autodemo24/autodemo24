import { NextRequest, NextResponse } from 'next/server';
import { getModelli } from '../../../lib/veicoli-db';

export async function GET(req: NextRequest) {
  const marca = req.nextUrl.searchParams.get('marca') ?? '';
  return NextResponse.json(getModelli(marca));
}
