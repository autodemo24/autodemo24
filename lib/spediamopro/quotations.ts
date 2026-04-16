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
  weight: number;   // in grammi
  length: number;   // in mm
  width: number;
  height: number;
  description?: string;
};

export type QuotationRequest = {
  parcels: Parcel[];
  sender: Address;
  consignee: Address;
  cashOnDelivery?: number;  // in centesimi di euro
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
  const resp = await spediamoFetch<{ quotations?: QuotationOption[]; items?: QuotationOption[] }>(
    demolitoreid,
    '/quotations',
    { method: 'POST', body: JSON.stringify(body) },
  );
  // L'API può restituire o "quotations" o "items"; proviamo entrambi.
  return (resp.quotations ?? resp.items ?? []) as QuotationOption[];
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
