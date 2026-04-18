import { XMLParser } from 'fast-xml-parser';
import { getApiBase } from './config';
import { getValidAccessToken } from './client';

const COMPATIBILITY_LEVEL = '1193';
const SITE_ID_ITALY = '101';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
});

function tradingEndpoint(): string {
  return `${getApiBase()}/ws/api.dll`;
}

async function tradingApiCall(
  demolitoreid: number,
  callName: string,
  innerXml: string,
): Promise<Record<string, unknown>> {
  const token = await getValidAccessToken(demolitoreid);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
${innerXml}
</${callName}Request>`;

  const res = await fetch(tradingEndpoint(), {
    method: 'POST',
    headers: {
      'X-EBAY-API-SITEID': SITE_ID_ITALY,
      'X-EBAY-API-COMPATIBILITY-LEVEL': COMPATIBILITY_LEVEL,
      'X-EBAY-API-CALL-NAME': callName,
      'X-EBAY-API-IAF-TOKEN': token,
      'Content-Type': 'text/xml',
    },
    body: xml,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`eBay Trading ${callName} HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const parsed = parser.parse(text) as Record<string, unknown>;
  const responseKey = `${callName}Response`;
  const response = parsed[responseKey] as Record<string, unknown> | undefined;
  if (!response) {
    throw new Error(`eBay Trading ${callName}: risposta non valida`);
  }

  const ack = response.Ack as string | undefined;
  if (ack && ack !== 'Success' && ack !== 'Warning') {
    const errors = extractTradingErrors(response);
    throw new Error(`eBay Trading ${callName} fallita: ${errors}`);
  }

  return response;
}

function extractTradingErrors(response: Record<string, unknown>): string {
  const errs = response.Errors;
  if (!errs) return 'errore sconosciuto';
  const list = Array.isArray(errs) ? errs : [errs];
  return list
    .map((e) => {
      const err = e as Record<string, unknown>;
      const short = err.ShortMessage as string | undefined;
      const long = err.LongMessage as string | undefined;
      return [short, long].filter(Boolean).join(' — ');
    })
    .join(' | ');
}

export type EbayListingSummary = {
  itemID: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  quantitySold: number;
  status: 'Active' | 'Ended' | 'Sold';
  thumbnailUrl: string | null;
  endTime: string | null;
  listingType: string | null;
};

export type GetSellingResult = {
  items: EbayListingSummary[];
  totalPages: number;
  totalItems: number;
};

type ListType = 'ActiveList' | 'SoldList' | 'DeletedFromSoldList';

export async function getMyEbaySelling(
  demolitoreid: number,
  listType: ListType,
  page = 1,
  entriesPerPage = 100,
): Promise<GetSellingResult> {
  const sortTag = listType === 'ActiveList' ? '<Sort>TimeLeft</Sort>' : '<Sort>EndTimeDescending</Sort>';
  const innerXml = `
  <${listType}>
    <Include>true</Include>
    ${sortTag}
    <Pagination>
      <EntriesPerPage>${entriesPerPage}</EntriesPerPage>
      <PageNumber>${page}</PageNumber>
    </Pagination>
  </${listType}>`;

  const response = await tradingApiCall(demolitoreid, 'GetMyeBaySelling', innerXml);
  const list = response[listType] as Record<string, unknown> | undefined;
  if (!list) return { items: [], totalPages: 0, totalItems: 0 };

  const pagRes = (list.PaginationResult as Record<string, unknown> | undefined) ?? {};
  const totalPages = Number(pagRes.TotalNumberOfPages ?? 1);
  const totalItems = Number(pagRes.TotalNumberOfEntries ?? 0);

  const itemArrayContainer = list.ItemArray as Record<string, unknown> | undefined;
  const rawItems = itemArrayContainer?.Item;
  const itemsRaw: Record<string, unknown>[] = !rawItems
    ? []
    : Array.isArray(rawItems)
      ? (rawItems as Record<string, unknown>[])
      : [rawItems as Record<string, unknown>];

  const items: EbayListingSummary[] = itemsRaw.map((it) => {
    const selling = (it.SellingStatus as Record<string, unknown> | undefined) ?? {};
    const currentPrice = selling.CurrentPrice as Record<string, unknown> | number | string | undefined;
    let price = 0;
    let currency = 'EUR';
    if (typeof currentPrice === 'object' && currentPrice !== null) {
      price = Number((currentPrice as Record<string, unknown>)['#text'] ?? 0);
      currency = String((currentPrice as Record<string, unknown>)['@_currencyID'] ?? 'EUR');
    } else if (currentPrice !== undefined) {
      price = Number(currentPrice);
    }

    const pic = it.PictureDetails as Record<string, unknown> | undefined;
    let thumb: string | null = null;
    if (pic) {
      const galleryUrl = pic.GalleryURL as string | undefined;
      const picUrl = pic.PictureURL;
      if (galleryUrl) thumb = galleryUrl;
      else if (typeof picUrl === 'string') thumb = picUrl;
      else if (Array.isArray(picUrl) && picUrl.length > 0) thumb = String(picUrl[0]);
    }

    const listingStatus = String(selling.ListingStatus ?? '');
    const quantitySold = Number(selling.QuantitySold ?? 0);
    const quantity = Number(it.Quantity ?? 0);

    let status: 'Active' | 'Ended' | 'Sold' = 'Active';
    if (listType === 'SoldList') status = 'Sold';
    else if (listType === 'DeletedFromSoldList') status = 'Ended';
    else if (listingStatus && listingStatus !== 'Active') status = 'Ended';

    return {
      itemID: String(it.ItemID ?? ''),
      title: String(it.Title ?? ''),
      price,
      currency,
      quantity,
      quantitySold,
      status,
      thumbnailUrl: thumb,
      endTime: (selling.EndTime ?? it.EndTime ?? null) as string | null,
      listingType: (it.ListingType ?? null) as string | null,
    };
  });

  return { items, totalPages, totalItems };
}

export type EbayItemSpecific = { name: string; values: string[] };

export type EbayCompatibilityEntry = {
  marca: string | null;
  modello: string | null;
  annoInizio: number | null;
  annoFine: number | null;
  versione: string | null;
};

export type EbayItemDetail = {
  itemID: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  conditionDisplayName: string | null;
  primaryCategoryId: string | null;
  primaryCategoryName: string | null;
  pictureURLs: string[];
  itemSpecifics: EbayItemSpecific[];
  compatibilities: EbayCompatibilityEntry[];
  shipping: {
    price: number | null;
    currency: string | null;
  };
  packageDetails: {
    weightGrams: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
  };
  endTime: string | null;
  listingStatus: string | null;
};

export async function getItem(demolitoreid: number, itemID: string): Promise<EbayItemDetail> {
  const innerXml = `
  <ItemID>${itemID}</ItemID>
  <DetailLevel>ReturnAll</DetailLevel>
  <IncludeItemSpecifics>true</IncludeItemSpecifics>
  <IncludeItemCompatibilityList>true</IncludeItemCompatibilityList>`;

  const response = await tradingApiCall(demolitoreid, 'GetItem', innerXml);
  const item = response.Item as Record<string, unknown> | undefined;
  if (!item) throw new Error(`GetItem ${itemID}: item non trovato in risposta`);

  const selling = (item.SellingStatus as Record<string, unknown> | undefined) ?? {};
  const currentPrice = selling.CurrentPrice as Record<string, unknown> | number | string | undefined;
  let price = 0;
  let currency = 'EUR';
  if (typeof currentPrice === 'object' && currentPrice !== null) {
    price = Number((currentPrice as Record<string, unknown>)['#text'] ?? 0);
    currency = String((currentPrice as Record<string, unknown>)['@_currencyID'] ?? 'EUR');
  } else if (currentPrice !== undefined) {
    price = Number(currentPrice);
  }

  const primary = item.PrimaryCategory as Record<string, unknown> | undefined;

  const pic = item.PictureDetails as Record<string, unknown> | undefined;
  const pictureURLs: string[] = [];
  if (pic) {
    const picUrl = pic.PictureURL;
    if (typeof picUrl === 'string') pictureURLs.push(picUrl);
    else if (Array.isArray(picUrl)) pictureURLs.push(...(picUrl as string[]).map(String));
  }

  const itemSpecifics: EbayItemSpecific[] = [];
  const itemSpecsContainer = item.ItemSpecifics as Record<string, unknown> | undefined;
  const nvRaw = itemSpecsContainer?.NameValueList;
  const nvArr: Record<string, unknown>[] = !nvRaw
    ? []
    : Array.isArray(nvRaw)
      ? (nvRaw as Record<string, unknown>[])
      : [nvRaw as Record<string, unknown>];
  for (const nv of nvArr) {
    const name = String(nv.Name ?? '').trim();
    const valueRaw = nv.Value;
    const values: string[] = !valueRaw
      ? []
      : Array.isArray(valueRaw)
        ? (valueRaw as unknown[]).map(String)
        : [String(valueRaw)];
    if (name) itemSpecifics.push({ name, values });
  }

  const compatibilities: EbayCompatibilityEntry[] = [];
  const compatList = item.ItemCompatibilityList as Record<string, unknown> | undefined;
  const compatRaw = compatList?.Compatibility;
  const compatArr: Record<string, unknown>[] = !compatRaw
    ? []
    : Array.isArray(compatRaw)
      ? (compatRaw as Record<string, unknown>[])
      : [compatRaw as Record<string, unknown>];
  for (const c of compatArr) {
    const nvs = c.NameValueList;
    const nvsArr: Record<string, unknown>[] = !nvs
      ? []
      : Array.isArray(nvs)
        ? (nvs as Record<string, unknown>[])
        : [nvs as Record<string, unknown>];

    const map: Record<string, string> = {};
    for (const nv of nvsArr) {
      const n = String(nv.Name ?? '').toLowerCase();
      const v = Array.isArray(nv.Value) ? String((nv.Value as unknown[])[0] ?? '') : String(nv.Value ?? '');
      if (n) map[n] = v;
    }

    const marca = map['make'] || map['marca'] || null;
    const modello = map['model'] || map['modello'] || null;
    const trim = map['trim'] || map['versione'] || null;
    const yearRaw = map['year'] || map['anno'] || '';
    let annoInizio: number | null = null;
    let annoFine: number | null = null;
    if (yearRaw) {
      const m = yearRaw.match(/(\d{4})(?:\s*-\s*(\d{4}))?/);
      if (m) {
        annoInizio = Number(m[1]);
        annoFine = m[2] ? Number(m[2]) : null;
      }
    }

    if (marca || modello) {
      compatibilities.push({ marca, modello, annoInizio, annoFine, versione: trim });
    }
  }

  // Shipping
  let shipPrice: number | null = null;
  let shipCurrency: string | null = null;
  const shippingDetails = item.ShippingDetails as Record<string, unknown> | undefined;
  if (shippingDetails) {
    const opts = shippingDetails.ShippingServiceOptions;
    const firstOpt = Array.isArray(opts) ? (opts[0] as Record<string, unknown>) : (opts as Record<string, unknown> | undefined);
    if (firstOpt) {
      const sCost = firstOpt.ShippingServiceCost as Record<string, unknown> | undefined;
      if (sCost) {
        shipPrice = Number(sCost['#text'] ?? 0);
        shipCurrency = String(sCost['@_currencyID'] ?? 'EUR');
      }
    }
  }

  // Package dimensions
  let weightGrams: number | null = null;
  let lengthCm: number | null = null;
  let widthCm: number | null = null;
  let heightCm: number | null = null;
  const pkg = item.ShippingPackageDetails as Record<string, unknown> | undefined;
  if (pkg) {
    const weightMajor = pkg.WeightMajor as Record<string, unknown> | undefined;
    const weightMinor = pkg.WeightMinor as Record<string, unknown> | undefined;
    if (weightMajor || weightMinor) {
      const majorVal = Number(weightMajor?.['#text'] ?? 0);
      const majorUnit = String(weightMajor?.['@_unit'] ?? 'kg').toLowerCase();
      const minorVal = Number(weightMinor?.['#text'] ?? 0);
      const minorUnit = String(weightMinor?.['@_unit'] ?? 'gr').toLowerCase();
      let grams = 0;
      if (majorUnit.startsWith('kg')) grams += majorVal * 1000;
      else if (majorUnit.startsWith('lb')) grams += majorVal * 453.592;
      else grams += majorVal;
      if (minorUnit.startsWith('gr') || minorUnit.startsWith('g')) grams += minorVal;
      else if (minorUnit.startsWith('oz')) grams += minorVal * 28.3495;
      weightGrams = grams > 0 ? Math.round(grams) : null;
    }

    const cmFromUnit = (v: unknown): number | null => {
      if (!v || typeof v !== 'object') return null;
      const vv = v as Record<string, unknown>;
      const raw = Number(vv['#text'] ?? 0);
      const unit = String(vv['@_unit'] ?? 'cm').toLowerCase();
      if (!raw) return null;
      if (unit.startsWith('in')) return Math.round(raw * 2.54);
      return Math.round(raw);
    };
    lengthCm = cmFromUnit(pkg.PackageLength);
    widthCm = cmFromUnit(pkg.PackageWidth);
    heightCm = cmFromUnit(pkg.PackageDepth);
  }

  return {
    itemID: String(item.ItemID ?? itemID),
    title: String(item.Title ?? ''),
    description: String(item.Description ?? ''),
    price,
    currency,
    quantity: Number(item.Quantity ?? 1),
    conditionDisplayName: (item.ConditionDisplayName ?? null) as string | null,
    primaryCategoryId: primary ? String(primary.CategoryID ?? '') : null,
    primaryCategoryName: primary ? String(primary.CategoryName ?? '') : null,
    pictureURLs,
    itemSpecifics,
    compatibilities,
    shipping: { price: shipPrice, currency: shipCurrency },
    packageDetails: { weightGrams, lengthCm, widthCm, heightCm },
    endTime: (selling.EndTime ?? null) as string | null,
    listingStatus: (selling.ListingStatus ?? null) as string | null,
  };
}
