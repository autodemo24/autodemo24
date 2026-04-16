import { spediamoFetch } from './client';

export type Address = {
  country: string;        // ISO 3166-1 alpha-2 (es. "IT")
  postalCode: string;
  city: string;
  province?: string;
};

export type ContactAddress = Address & {
  name: string;
  address: string;
  phone: string;
  email?: string;
};

export type Parcel = {
  type: number;     // 1 = package/box standard
  weight: number;   // in grammi
  length: number;   // in mm
  width: number;
  height: number;
  value?: number;   // valore merce in centesimi di euro (per assicurazione e limite corrieri)
  description?: string;
};

export type QuotationRequest = {
  parcels: Parcel[];
  sender: Address & { name?: string; address?: string; phone?: string; email?: string };
  consignee: Address & { name?: string; address?: string; phone?: string; email?: string };
  pickup?: { date: string; startTime?: string; endTime?: string };
  pickupDate?: string;
  cashOnDelivery?: number;
  insuranceValue?: number;
};

export type QuotationOption = {
  quotationId: string;
  carrier: string;          // es. "BRT", "GLS", "SDA"
  carrierService?: string;  // es. "Express", "Standard"
  price: {
    total: number;          // in centesimi? verificare
    currency?: string;
  };
  transitDays?: number;
  pickupDate?: string;
};

export async function requestQuotations(demolitoreid: number, body: QuotationRequest): Promise<QuotationOption[]> {
  const resp = await spediamoFetch<unknown>(
    demolitoreid,
    '/quotations',
    { method: 'POST', body: JSON.stringify(body) },
  );
  console.log('SpediamoPro /quotations raw response:', JSON.stringify(resp).slice(0, 2000));

  // Prova diversi field che SpediamoPro potrebbe usare
  if (Array.isArray(resp)) return resp as QuotationOption[];
  if (resp && typeof resp === 'object') {
    const obj = resp as Record<string, unknown>;
    if (Array.isArray(obj.quotations)) return obj.quotations as QuotationOption[];
    if (Array.isArray(obj.items)) return obj.items as QuotationOption[];
    if (Array.isArray(obj.data)) return obj.data as QuotationOption[];
    if (Array.isArray(obj.results)) return obj.results as QuotationOption[];
  }
  return [];
}

export type AcceptQuotationPayload = {
  quotationId: string;
  sender: ContactAddress;
  consignee: ContactAddress;
  labelFormat?: number;    // 0=PDF, 2=ZPL
  yourReference?: string;
  documentIds?: number[];
};

export type Shipment = {
  id: string;
  carrier?: string;
  trackingNumber?: string;
  labelAvailable?: boolean;
};

export async function acceptQuotation(demolitoreid: number, body: AcceptQuotationPayload): Promise<Shipment> {
  return spediamoFetch<Shipment>(
    demolitoreid,
    '/quotations/accept',
    { method: 'POST', body: JSON.stringify(body) },
  );
}
