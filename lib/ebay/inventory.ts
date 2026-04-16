import { ebayFetch } from './client';

export type InventoryItemPayload = {
  product: {
    title: string;
    description: string;
    aspects?: Record<string, string[]>;
    imageUrls?: string[];
    mpn?: string;
    ean?: string[];
    brand?: string;
  };
  condition: 'NEW' | 'LIKE_NEW' | 'USED_EXCELLENT' | 'USED_VERY_GOOD' | 'USED_GOOD' | 'USED_ACCEPTABLE' | 'FOR_PARTS_OR_NOT_WORKING';
  conditionDescription?: string;
  availability: {
    shipToLocationAvailability: { quantity: number };
  };
  packageWeightAndSize?: {
    weight?: { value: number; unit: 'KILOGRAM' | 'GRAM' };
    dimensions?: { length: number; width: number; height: number; unit: 'CENTIMETER' };
    packageType?: 'PACKAGE_THICK_ENVELOPE' | 'LARGE_CANADA_POSTBOX' | 'MAILING_BOX' | 'INDUSTRY_VEHICLES' | 'LARGE_ENVELOPE' | 'PARCEL_OR_PADDED_ENVELOPE';
  };
};

export type OfferPayload = {
  sku: string;
  marketplaceId: string;
  format: 'FIXED_PRICE';
  availableQuantity: number;
  categoryId: string;
  listingDescription?: string;
  listingPolicies: {
    fulfillmentPolicyId: string;
    paymentPolicyId: string;
    returnPolicyId: string;
  };
  pricingSummary: {
    price: { value: string; currency: 'EUR' };
  };
  merchantLocationKey: string;
};

export async function createOrReplaceInventoryItem(demolitoreid: number, sku: string, payload: InventoryItemPayload) {
  return ebayFetch(demolitoreid, `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createOffer(demolitoreid: number, payload: OfferPayload): Promise<{ offerId: string }> {
  return ebayFetch<{ offerId: string }>(demolitoreid, '/sell/inventory/v1/offer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function publishOffer(demolitoreid: number, offerId: string): Promise<{ listingId: string }> {
  return ebayFetch<{ listingId: string }>(demolitoreid, `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`, {
    method: 'POST',
  });
}

export async function withdrawOffer(demolitoreid: number, offerId: string) {
  return ebayFetch(demolitoreid, `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/withdraw`, {
    method: 'POST',
  });
}

export async function deleteOffer(demolitoreid: number, offerId: string) {
  return ebayFetch(demolitoreid, `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`, {
    method: 'DELETE',
  });
}

export async function deleteInventoryItem(demolitoreid: number, sku: string) {
  return ebayFetch(demolitoreid, `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: 'DELETE',
  });
}

export type CompatibilityPayload = {
  compatibleProducts: Array<{
    productFamilyProperties: {
      make: string;
      model: string;
      year: string;
      trim?: string;
    };
    notes?: string;
  }>;
};

export async function createCompatibility(demolitoreid: number, sku: string, payload: CompatibilityPayload) {
  return ebayFetch(demolitoreid, `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}/product_compatibility`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export type ListingPolicies = {
  fulfillmentPolicies: Array<{ fulfillmentPolicyId: string; name: string }>;
  paymentPolicies: Array<{ paymentPolicyId: string; name: string }>;
  returnPolicies: Array<{ returnPolicyId: string; name: string }>;
};

export async function fetchSellerPolicies(demolitoreid: number, marketplaceId = 'EBAY_IT'): Promise<ListingPolicies> {
  const [f, p, r] = await Promise.all([
    ebayFetch<{ fulfillmentPolicies?: Array<{ fulfillmentPolicyId: string; name: string }> }>(
      demolitoreid, `/sell/account/v1/fulfillment_policy?marketplace_id=${marketplaceId}`
    ),
    ebayFetch<{ paymentPolicies?: Array<{ paymentPolicyId: string; name: string }> }>(
      demolitoreid, `/sell/account/v1/payment_policy?marketplace_id=${marketplaceId}`
    ),
    ebayFetch<{ returnPolicies?: Array<{ returnPolicyId: string; name: string }> }>(
      demolitoreid, `/sell/account/v1/return_policy?marketplace_id=${marketplaceId}`
    ),
  ]);
  return {
    fulfillmentPolicies: f.fulfillmentPolicies ?? [],
    paymentPolicies: p.paymentPolicies ?? [],
    returnPolicies: r.returnPolicies ?? [],
  };
}

export type MerchantLocation = { merchantLocationKey: string; name?: string };

export async function fetchMerchantLocations(demolitoreid: number): Promise<MerchantLocation[]> {
  const data = await ebayFetch<{ locations?: MerchantLocation[] }>(
    demolitoreid, '/sell/inventory/v1/location'
  );
  return data.locations ?? [];
}

export type CreateLocationInput = {
  merchantLocationKey: string;
  name: string;
  addressLine1: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export async function createMerchantLocation(demolitoreid: number, input: CreateLocationInput) {
  const payload = {
    location: {
      address: {
        addressLine1: input.addressLine1,
        city: input.city,
        stateOrProvince: input.stateOrProvince,
        postalCode: input.postalCode,
        country: input.country,
      },
    },
    locationInstructions: 'Items ship from this location',
    name: input.name,
    merchantLocationStatus: 'ENABLED',
    locationTypes: ['WAREHOUSE'],
  };
  return ebayFetch(demolitoreid, `/sell/inventory/v1/location/${encodeURIComponent(input.merchantLocationKey)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
