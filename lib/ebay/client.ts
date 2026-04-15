import { prisma } from '../prisma';
import { getApiBase, getMarketplaceId } from './config';
import { refreshAccessToken } from './oauth';
import { encryptToken, decryptToken } from '../crypto';

const REFRESH_SKEW_MS = 60_000;

async function getValidAccessToken(demolitoreid: number): Promise<string> {
  const conn = await prisma.ebayConnection.findUnique({ where: { demolitoreid } });
  if (!conn) throw new Error('EBAY_NOT_CONNECTED');

  const now = Date.now();
  if (conn.expiresAt.getTime() - REFRESH_SKEW_MS > now) {
    return decryptToken(conn.accessToken);
  }

  if (conn.refreshExpiresAt.getTime() < now) {
    throw new Error('EBAY_REFRESH_EXPIRED');
  }

  const refreshed = await refreshAccessToken(decryptToken(conn.refreshToken));
  const newExpires = new Date(now + refreshed.expires_in * 1000);
  await prisma.ebayConnection.update({
    where: { demolitoreid },
    data: {
      accessToken: encryptToken(refreshed.access_token),
      expiresAt: newExpires,
    },
  });
  return refreshed.access_token;
}

export type EbayFetchOptions = RequestInit & {
  marketplaceId?: string;
  contentLanguage?: string;
};

export async function ebayFetch<T = unknown>(
  demolitoreid: number,
  path: string,
  options: EbayFetchOptions = {},
): Promise<T> {
  const token = await getValidAccessToken(demolitoreid);
  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;

  const lang = options.contentLanguage ?? 'it-IT';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-EBAY-C-MARKETPLACE-ID': options.marketplaceId ?? getMarketplaceId(),
    'Content-Language': lang,
    'Accept-Language': lang,
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const r = await fetch(url, { ...options, headers });
  const text = await r.text();
  const data = text ? safeJson(text) : null;

  if (!r.ok) {
    const msg = extractEbayError(data) ?? `HTTP ${r.status}`;
    const err = new Error(`eBay API ${path} fallita: ${msg}`) as Error & { status?: number; body?: unknown };
    err.status = r.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

function extractEbayError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const errors = obj.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors.map((e) => {
      const ee = e as Record<string, unknown>;
      const base = [ee.message, ee.longMessage].filter(Boolean).join(' — ');
      const params = Array.isArray(ee.parameters)
        ? (ee.parameters as Array<{ name?: string; value?: string }>)
            .map((p) => p.name && p.value ? `${p.name}=${p.value}` : p.name || p.value)
            .filter(Boolean)
            .join(', ')
        : '';
      return params ? `${base} (${params})` : base;
    }).filter(Boolean);
    return parts.join(' | ');
  }
  return null;
}
