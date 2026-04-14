export type ModelloAutoLite = {
  id: number;
  marca: string;
  modello: string;
  serie: string | null;
  annoInizio: number;
  annoFine: number | null;
};

export function labelModello(m: Pick<ModelloAutoLite, 'modello' | 'serie' | 'annoInizio' | 'annoFine'>): string {
  const base = m.serie ? `${m.modello} ${m.serie}` : m.modello;
  const anni = m.annoFine ? `${m.annoInizio}-${m.annoFine}` : `${m.annoInizio}→`;
  return `${base} (${anni})`;
}

export function annoMedio(m: Pick<ModelloAutoLite, 'annoInizio' | 'annoFine'>): number {
  if (m.annoFine) return Math.floor((m.annoInizio + m.annoFine) / 2);
  const oggi = new Date().getFullYear();
  return Math.floor((m.annoInizio + oggi) / 2);
}
