import type { EbayItemDetail } from './trading';
import { findCategoryById } from './categories';

export type RicambioImportPayload = {
  nome: string;
  titolo: string | null;
  categoria: string;
  categoriaEbayId: string | null;
  marca: string;
  modello: string;
  ubicazione: string;
  prezzo: number;
  quantita: number;
  descrizione: string | null;
  condizione: string | null;
  anno: number | null;
  cilindrata: string | null;
  alimentazione: string | null;
  telaio: string | null;
  codiceMotore: string | null;
  mpn: string | null;
  codiceOe: string | null;
  ean: string | null;
  kw: number | null;
  prezzoSpedizione: number | null;
  peso: number | null;
  lunghezzaCm: number | null;
  larghezzaCm: number | null;
  altezzaCm: number | null;
  fotoUrls: string[];
  compatibilita: Array<{
    marca: string;
    modello: string;
    annoInizio: number;
    annoFine: number | null;
    versione: string | null;
  }>;
};

export type MapResult =
  | { ok: true; payload: RicambioImportPayload; warnings: string[] }
  | { ok: false; reason: string };

const DEFAULT_UBICAZIONE = 'DA ASSEGNARE';
const DEFAULT_CATEGORIA = 'ALTRO';

const MARCA_NAMES = ['marca', 'brand', 'marchio', 'make'];
const MODELLO_NAMES = ['modello', 'model', 'modello compatibile', 'modello auto'];
const ANNO_NAMES = ['anno', 'year', 'anno di produzione'];
const MPN_NAMES = [
  'numero di parte del produttore',
  'numero di riferimento oe/oem',
  'mpn',
  'manufacturer part number',
];
const OE_NAMES = [
  'oe/oem reference number',
  'numero di riferimento oe',
  'codice oe',
  'codice oem',
  'oem',
];
const EAN_NAMES = ['ean', 'codice a barre', 'barcode'];
const CILINDRATA_NAMES = ['cilindrata', 'engine displacement'];
const ALIMENTAZIONE_NAMES = ['alimentazione', 'tipo di carburante', 'fuel type'];
const TELAIO_NAMES = ['numero di telaio', 'telaio', 'vin'];
const CODICE_MOTORE_NAMES = ['codice motore', 'engine code'];
const KW_NAMES = ['kw', 'potenza kw', 'potenza (kw)'];

function findSpecific(
  specifics: EbayItemDetail['itemSpecifics'],
  names: string[],
): string | null {
  const lowerNames = names.map((n) => n.toLowerCase());
  const hit = specifics.find((s) => lowerNames.includes(s.name.toLowerCase()));
  if (!hit || hit.values.length === 0) return null;
  const v = hit.values[0]?.trim();
  return v && v !== '-' && v !== '--' ? v : null;
}

const CONDIZIONI_AUTIGO = ['Usato', 'Nuovo', 'Ricondizionato', 'Come nuovo', 'Per ricambi'];

function normalizeCondizione(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('nuov') && s.includes('etichett')) return 'Nuovo';
  if (s.includes('nuov')) return 'Nuovo';
  if (s.includes('come nuov')) return 'Come nuovo';
  if (s.includes('ricondiz') || s.includes('rigenerat') || s.includes('revisionat')) return 'Ricondizionato';
  if (s.includes('per ricambi') || s.includes('non funzionant')) return 'Per ricambi';
  if (s.includes('usat')) return 'Usato';
  // fallback: esact match
  const exact = CONDIZIONI_AUTIGO.find((c) => c.toLowerCase() === s);
  return exact ?? 'Usato';
}

function numberOrNull(s: string | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseAnno(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d{4})/);
  if (!m) return null;
  const n = Number(m[1]);
  const year = new Date().getFullYear();
  return n >= 1900 && n <= year + 1 ? n : null;
}

export function mapEbayItemToRicambio(item: EbayItemDetail): MapResult {
  const warnings: string[] = [];

  const marca = findSpecific(item.itemSpecifics, MARCA_NAMES);
  const modello = findSpecific(item.itemSpecifics, MODELLO_NAMES);

  if (!marca) {
    return { ok: false, reason: "Item specific 'Marca' mancante sull'inserzione eBay" };
  }
  if (!modello) {
    return { ok: false, reason: "Item specific 'Modello' mancante sull'inserzione eBay" };
  }

  const cat = item.primaryCategoryId ? findCategoryById(item.primaryCategoryId) : undefined;
  const categoria = cat?.label ?? DEFAULT_CATEGORIA;
  if (!cat && item.primaryCategoryId) {
    warnings.push(`Categoria eBay ${item.primaryCategoryId} non mappata, uso "${DEFAULT_CATEGORIA}"`);
  }

  const annoRaw = findSpecific(item.itemSpecifics, ANNO_NAMES);
  const anno = parseAnno(annoRaw);

  const kwRaw = findSpecific(item.itemSpecifics, KW_NAMES);
  const kw = numberOrNull(kwRaw);

  const compatibilita = item.compatibilities
    .filter((c) => c.marca && c.modello && c.annoInizio)
    .map((c) => ({
      marca: String(c.marca),
      modello: String(c.modello),
      annoInizio: c.annoInizio as number,
      annoFine: c.annoFine,
      versione: c.versione,
    }));

  const titolo = item.title.slice(0, 80);
  const prezzo = item.price > 0 ? item.price : 0;

  const payload: RicambioImportPayload = {
    nome: item.title.slice(0, 120),
    titolo,
    categoria,
    categoriaEbayId: item.primaryCategoryId ?? null,
    marca,
    modello,
    ubicazione: DEFAULT_UBICAZIONE,
    prezzo,
    quantita: Math.max(1, item.quantity || 1),
    descrizione: item.description || null,
    condizione: normalizeCondizione(item.conditionDisplayName),
    anno,
    cilindrata: findSpecific(item.itemSpecifics, CILINDRATA_NAMES),
    alimentazione: findSpecific(item.itemSpecifics, ALIMENTAZIONE_NAMES),
    telaio: findSpecific(item.itemSpecifics, TELAIO_NAMES),
    codiceMotore: findSpecific(item.itemSpecifics, CODICE_MOTORE_NAMES),
    mpn: findSpecific(item.itemSpecifics, MPN_NAMES),
    codiceOe: findSpecific(item.itemSpecifics, OE_NAMES),
    ean: findSpecific(item.itemSpecifics, EAN_NAMES),
    kw,
    prezzoSpedizione: item.shipping.price ?? null,
    peso: item.packageDetails.weightGrams,
    lunghezzaCm: item.packageDetails.lengthCm,
    larghezzaCm: item.packageDetails.widthCm,
    altezzaCm: item.packageDetails.heightCm,
    fotoUrls: [],
    compatibilita,
  };

  return { ok: true, payload, warnings };
}
