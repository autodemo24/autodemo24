import { getAuthBase, getApiBase, getCredentials, OAUTH_SCOPES } from './config';

export type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
};

export function buildAuthorizeUrl(state: string): string {
  const { appId, ruName } = getCredentials();
  const qs = new URLSearchParams({
    client_id: appId,
    response_type: 'code',
    redirect_uri: ruName,
    scope: OAUTH_SCOPES.join(' '),
    state,
    prompt: 'login',
  });
  return `${getAuthBase()}/oauth2/authorize?${qs.toString()}`;
}

function basicAuthHeader(): string {
  const { appId, certId } = getCredentials();
  return 'Basic ' + Buffer.from(`${appId}:${certId}`).toString('base64');
}

export async function exchangeCodeForTokens(code: string): Promise<EbayTokenResponse> {
  const { ruName } = getCredentials();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: ruName,
  });
  const r = await fetch(`${getApiBase()}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`eBay token exchange fallito (${r.status}): ${text}`);
  }
  return r.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<Omit<EbayTokenResponse, 'refresh_token' | 'refresh_token_expires_in'>> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: OAUTH_SCOPES.join(' '),
  });
  const r = await fetch(`${getApiBase()}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`eBay token refresh fallito (${r.status}): ${text}`);
  }
  return r.json();
}

export async function fetchEbayUserId(accessToken: string): Promise<string | null> {
  const r = await fetch(`${getApiBase()}/commerce/identity/v1/user/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.username ?? data.userId ?? null;
}
