import { prisma } from '../prisma';
import { decryptToken, encryptToken } from '../crypto';
import { getApiBase, type SpediamoEnv } from './config';

const REFRESH_SKEW_MS = 60_000;

async function getToken(demolitoreid: number): Promise<{ token: string; env: SpediamoEnv }> {
  const conn = await prisma.spediamoProConnection.findUnique({ where: { demolitoreid } });
  if (!conn) throw new Error('SPEDIAMOPRO_NOT_CONNECTED');

  const now = Date.now();
  const env = (conn.environment as SpediamoEnv) || 'staging';

  if (conn.accessToken && conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() - REFRESH_SKEW_MS > now) {
    return { token: decryptToken(conn.accessToken), env };
  }

  const authcode = decryptToken(conn.authcode);
  const basicAuth = Buffer.from(`${authcode}:`).toString('base64');

  const r = await fetch(`${getApiBase(env)}/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`SpediamoPro auth fallita (${r.status}): ${text.slice(0, 300)}`);
  }
  const data = await r.json();
  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) ?? 3600;
  const expiresAt = new Date(now + expiresIn * 1000);

  await prisma.spediamoProConnection.update({
    where: { demolitoreid },
    data: {
      accessToken: encryptToken(accessToken),
      tokenExpiresAt: expiresAt,
    },
  });

  return { token: accessToken, env };
}

export async function spediamoFetch<T = unknown>(
  demolitoreid: number,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { token, env } = await getToken(demolitoreid);
  const url = path.startsWith('http') ? path : `${getApiBase(env)}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(init.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const r = await fetch(url, { ...init, headers });
  const text = await r.text();
  const data: unknown = text ? safeJson(text) : null;

  if (!r.ok) {
    const msg = extractError(data) ?? `HTTP ${r.status}`;
    const err = new Error(`SpediamoPro ${path}: ${msg}`) as Error & { status?: number; body?: unknown };
    err.status = r.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

// Fetch binario (per download etichette). Ritorna Buffer.
export async function spediamoFetchBinary(
  demolitoreid: number,
  path: string,
): Promise<{ buffer: Buffer; contentType: string; filename?: string }> {
  const { token, env } = await getToken(demolitoreid);
  const url = path.startsWith('http') ? path : `${getApiBase(env)}${path}`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`SpediamoPro binary ${path} fallita (${r.status}): ${text.slice(0, 300)}`);
  }

  const buf = Buffer.from(await r.arrayBuffer());
  const contentType = r.headers.get('content-type') ?? 'application/octet-stream';
  const filename = r.headers.get('x-filename') ?? undefined;

  return { buffer: buf, contentType, filename };
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

function extractError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === 'string') return obj.error as string;
  if (typeof obj.message === 'string') return obj.message as string;
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    return obj.errors.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join(' | ');
  }
  return null;
}
