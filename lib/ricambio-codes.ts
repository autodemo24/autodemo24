export function generaCodice(id: number): string {
  return `RC-${String(id).padStart(6, '0')}`;
}

export function generaQrPayload(id: number, codice: string, demolitoreId: number, targa?: string): string {
  const payload: QrPayload = { id, codice, demolitoreId };
  if (targa) payload.targa = targa;
  return JSON.stringify(payload);
}

export type QrPayload = { id: number; codice: string; demolitoreId: number; targa?: string };

export function parseQrPayload(raw: string): QrPayload | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return null;
    const parsed = JSON.parse(trimmed) as Partial<QrPayload>;
    if (typeof parsed.id !== 'number' || typeof parsed.codice !== 'string' || typeof parsed.demolitoreId !== 'number') {
      return null;
    }
    return parsed as QrPayload;
  } catch {
    return null;
  }
}
