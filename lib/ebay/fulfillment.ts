import { ebayFetch } from './client';

export type EbayOrderLineItem = {
  lineItemId: string;
  sku?: string;
  title: string;
  quantity: number;
  lineItemCost: { value: string; currency: string };
  itemLocation?: { countryCode?: string };
};

export type EbayOrderBuyer = {
  username?: string;
  buyerRegistrationAddress?: {
    fullName?: string;
    contactAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      postalCode?: string;
      stateOrProvince?: string;
      countryCode?: string;
    };
    email?: string;
    primaryPhone?: { phoneNumber?: string };
  };
  taxAddress?: {
    postalCode?: string;
    stateOrProvince?: string;
    countryCode?: string;
  };
};

export type EbayOrder = {
  orderId: string;
  creationDate: string;
  lastModifiedDate: string;
  orderFulfillmentStatus: string;
  orderPaymentStatus: string;
  sellerId?: string;
  buyer?: EbayOrderBuyer;
  buyerCheckoutNotes?: string;
  pricingSummary?: {
    total?: { value: string; currency: string };
    priceSubtotal?: { value: string; currency: string };
    deliveryCost?: { value: string; currency: string };
  };
  fulfillmentStartInstructions?: Array<{
    shippingStep?: {
      shipTo?: {
        fullName?: string;
        email?: string;
        primaryPhone?: { phoneNumber?: string };
        contactAddress?: {
          addressLine1?: string;
          addressLine2?: string;
          city?: string;
          postalCode?: string;
          stateOrProvince?: string;
          countryCode?: string;
        };
      };
    };
  }>;
  lineItems?: EbayOrderLineItem[];
  cancelStatus?: { cancelState?: string };
};

export async function getOrder(demolitoreid: number, orderId: string): Promise<EbayOrder> {
  return ebayFetch<EbayOrder>(demolitoreid, `/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}`);
}

export type ShippingFulfillmentPayload = {
  lineItems: Array<{ lineItemId: string; quantity: number }>;
  shippedDate: string; // ISO
  shippingCarrierCode: string;
  trackingNumber: string;
};

export async function createShippingFulfillment(
  demolitoreid: number,
  orderId: string,
  payload: ShippingFulfillmentPayload,
): Promise<{ fulfillmentId?: string }> {
  return ebayFetch<{ fulfillmentId?: string }>(
    demolitoreid,
    `/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}
