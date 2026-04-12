import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '../../../../lib/admin-session';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Credenziali admin non configurate' }, { status: 500 });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
  }

  await createAdminSession(email);
  return NextResponse.json({ ok: true });
}
