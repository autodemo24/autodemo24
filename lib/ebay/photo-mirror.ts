import { uploadBufferToR2 } from '../upload-to-r2';

const MAX_PARALLEL = 3;
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function mirrorOne(
  demolitoreid: number,
  url: string,
): Promise<{ ok: true; url: string } | { ok: false; source: string; reason: string }> {
  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) {
      return { ok: false, source: url, reason: `HTTP ${res.status}` };
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return { ok: false, source: url, reason: `Not an image (${contentType})` };
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      return { ok: false, source: url, reason: 'Buffer vuoto' };
    }
    const uploaded = await uploadBufferToR2(buffer, demolitoreid, 'ricambi');
    return { ok: true, url: uploaded.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, source: url, reason: msg };
  }
}

export type MirrorResult = {
  mirroredUrls: string[];
  errors: Array<{ source: string; reason: string }>;
};

export async function mirrorEbayPhotos(
  demolitoreid: number,
  pictureURLs: string[],
): Promise<MirrorResult> {
  const mirroredUrls: string[] = [];
  const errors: Array<{ source: string; reason: string }> = [];

  for (let i = 0; i < pictureURLs.length; i += MAX_PARALLEL) {
    const batch = pictureURLs.slice(i, i + MAX_PARALLEL);
    const results = await Promise.all(batch.map((u) => mirrorOne(demolitoreid, u)));
    for (const r of results) {
      if (r.ok) mirroredUrls.push(r.url);
      else errors.push({ source: r.source, reason: r.reason });
    }
  }

  return { mirroredUrls, errors };
}
