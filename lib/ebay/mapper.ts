import type { InventoryItemPayload, OfferPayload, CompatibilityPayload } from './inventory';

type RicambioInput = {
  id: number;
  codice: string;
  nome: string;
  titolo: string | null;
  categoriaEbayId: string | null;
  marca: string;
  modello: string;
  anno: number | null;
  targa: string | null;
  codiceOe: string | null;
  mpn: string | null;
  ean: string | null;
  quantita: number;
  condizione: string | null;
  condDescrizione: string | null;
  descrizione: string | null;
  prezzo: { toString(): string };
  peso: number | null;
  lunghezzaCm: number | null;
  larghezzaCm: number | null;
  altezzaCm: number | null;
  foto: Array<{ url: string; copertina: boolean }>;
};

type CompatibilitaInput = {
  marca: string;
  modello: string;
  annoInizio: number;
  annoFine: number | null;
  versione: string | null;
};

const CONDIZIONE_MAP: Record<string, InventoryItemPayload['condition']> = {
  'Nuovo': 'NEW',
  'Come nuovo': 'USED_EXCELLENT',
  'Usato': 'USED_EXCELLENT',
  'Usato - ottime condizioni': 'USED_EXCELLENT',
  'Usato - buone condizioni': 'USED_VERY_GOOD',
  'Usato - condizioni accettabili': 'USED_ACCEPTABLE',
  'Per ricambi o non funzionante': 'FOR_PARTS_OR_NOT_WORKING',
};

export function mapCondizione(input: string | null): InventoryItemPayload['condition'] {
  if (!input) return 'USED_EXCELLENT';
  return CONDIZIONE_MAP[input] ?? 'USED_EXCELLENT';
}

export function skuFor(ricambio: Pick<RicambioInput, 'codice'>): string {
  return ricambio.codice;
}

export function buildInventoryItemPayload(r: RicambioInput): InventoryItemPayload {
  const title = (r.titolo ?? r.nome).slice(0, 80);
  const description = r.descrizione?.trim() || r.nome;

  const aspects: Record<string, string[]> = {
    'Marca': [r.marca],
    'Modello': [r.modello],
    'MPN': [r.mpn?.trim() || 'Non applicabile'],
    'Brand': [r.marca],
  };
  if (r.codiceOe) aspects['Codice ricambio originale OE/OEM'] = [r.codiceOe];
  if (r.anno) aspects['Anno'] = [String(r.anno)];
  if (r.targa) aspects['Targa veicolo di provenienza'] = [r.targa];

  const imageUrls = [...r.foto]
    .sort((a, b) => (b.copertina ? 1 : 0) - (a.copertina ? 1 : 0))
    .map((f) => f.url)
    .slice(0, 24);

  const payload: InventoryItemPayload = {
    product: {
      title,
      description,
      aspects,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      brand: r.marca,
      mpn: r.mpn?.trim() || 'Non applicabile',
      ...(r.ean ? { ean: [r.ean] } : {}),
    },
    condition: mapCondizione(r.condizione),
    ...(r.condDescrizione ? { conditionDescription: r.condDescrizione.slice(0, 1000) } : {}),
    availability: {
      shipToLocationAvailability: { quantity: Math.max(1, r.quantita) },
    },
  };

  if (r.peso || (r.lunghezzaCm && r.larghezzaCm && r.altezzaCm)) {
    payload.packageWeightAndSize = {};
    if (r.peso) {
      payload.packageWeightAndSize.weight = { value: r.peso, unit: 'GRAM' };
    }
    if (r.lunghezzaCm && r.larghezzaCm && r.altezzaCm) {
      payload.packageWeightAndSize.dimensions = {
        length: r.lunghezzaCm,
        width: r.larghezzaCm,
        height: r.altezzaCm,
        unit: 'CENTIMETER',
      };
    }
  }

  return payload;
}

export function buildOfferPayload(args: {
  ricambio: RicambioInput;
  categoryId: string;
  fulfillmentPolicyId: string;
  paymentPolicyId: string;
  returnPolicyId: string;
  merchantLocationKey: string;
  marketplaceId?: string;
}): OfferPayload {
  const { ricambio, categoryId, fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey } = args;
  return {
    sku: skuFor(ricambio),
    marketplaceId: args.marketplaceId ?? 'EBAY_IT',
    format: 'FIXED_PRICE',
    availableQuantity: Math.max(1, ricambio.quantita),
    categoryId,
    listingDescription: ricambio.descrizione?.trim() || ricambio.nome,
    listingPolicies: {
      fulfillmentPolicyId,
      paymentPolicyId,
      returnPolicyId,
    },
    pricingSummary: {
      price: { value: ricambio.prezzo.toString(), currency: 'EUR' },
    },
    merchantLocationKey,
  };
}

export function buildCompatibilityPayload(compatibilita: CompatibilitaInput[]): CompatibilityPayload {
  const products: CompatibilityPayload['compatibleProducts'] = [];
  for (const c of compatibilita) {
    const annoFine = c.annoFine ?? new Date().getFullYear();
    for (let year = c.annoInizio; year <= annoFine; year++) {
      products.push({
        productFamilyProperties: {
          make: c.marca,
          model: c.modello,
          year: String(year),
          ...(c.versione ? { trim: c.versione } : {}),
        },
      });
    }
  }
  return { compatibleProducts: products };
}
