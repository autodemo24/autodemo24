import { spediamoFetch } from './client';

export type Parcel = {
  type: number;    // 0 o 1
  weight: number;  // grammi
  length: number;  // mm
  width: number;
  height: number;
};

export type AddressBase = {
  postalCode: string;
  city: string;
  country: string;       // ISO2 es. "IT"
};

export type AddressExtended = AddressBase & {
  name?: string;
  at?: string;
  address?: string;
  addressLine2?: string;
  addressLine3?: string;
  province?: string;
  phone?: string;
  email?: string;
};

export type AddressFull = AddressBase & {
  name: string;
  address: string;
  phone: string;
  email: string;
  at?: string;
  addressLine2?: string;
  addressLine3?: string;
  province?: string;
};

export type QuotationRequest = {
  parcels: Parcel[];
  sender: AddressExtended;
  consignee: AddressExtended;
  cashOnDeliveryAmount?: number;  // centesimi
  insuredAmount?: number;          // centesimi
  couriers?: Array<'brt' | 'inpost' | 'sda' | 'ups'>;
};

export type PriceBreakdown = {
  basePrice: number;
  fuelSurcharge: number;
  accessoryServicePrice: number;
  vatRate: number;
  vatAmount: number;
};

export type QuotationOption = {
  service: number;                  // ID del service, si passa in accept
  serviceCode: string;              // es. "brt.express"
  deliveryTime: number;             // giorni lavorativi
  expectedDeliveryDate: string;
  firstAvailablePickupDate: string;
  totalPrice: number;               // centesimi
  priceBreakdown: PriceBreakdown;
};

// Filtra fuori i servizi PUDO (pickup point / locker / drop-off) che richiedono
// un consigneePickupPointId non ancora gestito. Mantiene solo home delivery.
function isHomeDelivery(serviceCode: string): boolean {
  const code = serviceCode.toLowerCase();
  return !code.includes('pudo') && !code.includes('locker') && !code.includes('dropoff') && !code.includes('drop_off');
}

export async function requestQuotations(demolitoreid: number, body: QuotationRequest): Promise<QuotationOption[]> {
  const resp = await spediamoFetch<{ data?: QuotationOption[] }>(
    demolitoreid,
    '/quotations',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return (resp.data ?? []).filter((q) => isHomeDelivery(q.serviceCode));
}

export type AcceptQuotationPayload = {
  parcels: Parcel[];
  sender: AddressFull;
  consignee: AddressFull;
  quotation: {
    service: number;
    expectedDeliveryDate: string;
    firstAvailablePickupDate: string;
    priceBreakdown: PriceBreakdown;
  };
  labelFormat: number;         // 0=PDF, 1=GIF, 2=ZPL, 3=10x11cm PDF InPost
  cashOnDeliveryAmount?: number;
  insuredAmount?: number;
  documents?: number[];
  consigneeNote?: string;
  externalId?: string;
  externalReference?: string;
  deliveryPudo?: string;
};

export type Shipment = {
  id: number;
  code: string;
  trackingCode?: string;
  courierService?: { courier: string; code: string };
};

export async function acceptQuotation(demolitoreid: number, body: AcceptQuotationPayload): Promise<Shipment> {
  const resp = await spediamoFetch<{ data: Shipment }>(
    demolitoreid,
    '/quotations/accept',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return resp.data;
}
