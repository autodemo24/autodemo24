export type EbayEnvironment = 'sandbox' | 'production';

export function getEbayEnv(): EbayEnvironment {
  const v = (process.env.EBAY_ENVIRONMENT ?? 'sandbox').toLowerCase();
  return v === 'production' ? 'production' : 'sandbox';
}

export function getCredentials() {
  const env = getEbayEnv();
  const prefix = env === 'production' ? 'EBAY_PROD_' : 'EBAY_SANDBOX_';
  const appId = process.env[`${prefix}APP_ID`];
  const certId = process.env[`${prefix}CERT_ID`];
  const devId = process.env[`${prefix}DEV_ID`];
  const ruName = process.env[`${prefix}RU_NAME`];
  if (!appId || !certId || !devId || !ruName) {
    throw new Error(`Credenziali eBay ${env} mancanti in env (${prefix}APP_ID/CERT_ID/DEV_ID/RU_NAME)`);
  }
  return { env, appId, certId, devId, ruName };
}

export function getApiBase() {
  return getEbayEnv() === 'production'
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com';
}

export function getAuthBase() {
  return getEbayEnv() === 'production'
    ? 'https://auth.ebay.com'
    : 'https://auth.sandbox.ebay.com';
}

export function getMarketplaceId() {
  return 'EBAY_IT';
}

export const OAUTH_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
  'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription',
];
