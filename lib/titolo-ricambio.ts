// Genera il titolo eBay-style da un ricambio, max 80 caratteri.
// Stessa logica usata nel RicambioForm (client-side) ma riproducibile server-side.

export type TitoloRicambioInput = {
  nome: string;
  marca: string;
  modello: string;
  anno?: number | null;
  codiceOe?: string | null;
  mpn?: string | null;
  compatibilita?: Array<{
    marca: string;
    modello: string;
    annoInizio: number;
    annoFine: number | null;
    versione?: string | null;
  }>;
  modelloAuto?: {
    serie?: string | null;
    annoInizio?: number;
    annoFine?: number | null;
  } | null;
};

export function generaTitoloRicambio(r: TitoloRicambioInput): string {
  let serieAnni = '';
  if (r.compatibilita && r.compatibilita.length > 0) {
    const c = r.compatibilita[0];
    const anni = c.annoFine ? `${c.annoInizio}-${c.annoFine}` : `${c.annoInizio}+`;
    serieAnni = c.versione ? `${c.versione} (${anni})` : `(${anni})`;
  } else if (r.modelloAuto?.annoInizio) {
    const anni = r.modelloAuto.annoFine ? `${r.modelloAuto.annoInizio}-${r.modelloAuto.annoFine}` : `${r.modelloAuto.annoInizio}+`;
    serieAnni = r.modelloAuto.serie ? `${r.modelloAuto.serie} (${anni})` : `(${anni})`;
  } else if (r.anno) {
    serieAnni = `(${r.anno})`;
  }

  const parts: string[] = [];
  if (r.nome?.trim()) parts.push(r.nome.trim());
  if (r.marca?.trim()) parts.push(r.marca.trim());
  if (r.modello?.trim()) parts.push(r.modello.trim());
  if (serieAnni) parts.push(serieAnni);
  if (r.codiceOe?.trim()) parts.push(r.codiceOe.trim());
  const mpn = r.mpn?.trim() ?? '';
  if (mpn && mpn.toLowerCase() !== 'non applicabile') parts.push(mpn);

  let t = '';
  for (const p of parts) {
    const next = t ? `${t} ${p}` : p;
    if (next.length > 80) {
      if (!t) return next.slice(0, 80);
      break;
    }
    t = next;
  }
  return t;
}
