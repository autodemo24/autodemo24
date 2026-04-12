export const PIANI = {
  FREE: {
    label: 'Free',
    prezzo: 0,
    maxTargaMese: 20,
    priceId: null as string | null,
  },
  START: {
    label: 'Start',
    prezzo: 19.9,
    maxTargaMese: 100,
    priceId: process.env.STRIPE_PRICE_START ?? null,
  },
  PRO: {
    label: 'Pro',
    prezzo: 39.9,
    maxTargaMese: 500,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
  },
  ULTRA: {
    label: 'Ultra',
    prezzo: 99.9,
    maxTargaMese: Infinity,
    priceId: process.env.STRIPE_PRICE_ULTRA ?? null,
  },
} as const;

export type PianoKey = keyof typeof PIANI;

export function pianoFromPriceId(priceId: string): PianoKey | null {
  for (const [key, val] of Object.entries(PIANI)) {
    if (val.priceId === priceId) return key as PianoKey;
  }
  return null;
}

export function getMaxTarga(piano: string): number {
  return (PIANI[piano as PianoKey]?.maxTargaMese ?? PIANI.FREE.maxTargaMese) as number;
}
