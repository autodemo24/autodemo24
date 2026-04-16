import crypto from 'node:crypto';
import { ebayFetch } from './client';
import { getApiBase, getCredentials } from './config';

// Topic eBay Commerce Notification utili per il nostro caso d'uso
export const NOTIFICATION_TOPICS = {
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION', // USER scope: notifica quando arriva un ordine
  ITEM_MARKED_SHIPPED: 'ITEM_MARKED_SHIPPED', // USER scope: quando il venditore segna come spedito
  ITEM_AVAILABILITY: 'ITEM_AVAILABILITY', // APPLICATION scope: quando cambia availability
} as const;

export type NotificationSubscription = {
  subscriptionId: string;
  topicId: string;
  status: string;
};

async function getAppToken(): Promise<string> {
  const { appId, certId } = getCredentials();
  const basicAuth = Buffer.from(`${appId}:${certId}`).toString('base64');
  const r = await fetch(`${getApiBase()}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope'),
  });
  if (!r.ok) throw new Error(`Impossibile ottenere app token: ${r.status}`);
  const data = await r.json();
  return data.access_token as string;
}

function getWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/ebay/notifications`;
}

function getVerificationToken(): string {
  const t = process.env.EBAY_NOTIFICATION_VERIFICATION_TOKEN;
  if (!t || t.length < 32) {
    throw new Error('EBAY_NOTIFICATION_VERIFICATION_TOKEN mancante o troppo corto (min 32 char)');
  }
  return t;
}

export function computeChallengeResponse(challengeCode: string, endpointUrl: string): string {
  const token = getVerificationToken();
  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(token);
  hash.update(endpointUrl);
  return hash.digest('hex');
}

// Subscribe USER-scope topic per un demolitore specifico (usa user token)
export async function subscribeUserTopic(
  demolitoreid: number,
  topicId: string,
): Promise<NotificationSubscription | null> {
  const payload = {
    topicId,
    status: 'ENABLED',
    destination: {
      deliveryConfig: {
        endpoint: getWebhookUrl(),
        verificationToken: getVerificationToken(),
      },
    },
    payload: {
      format: 'JSON',
      schemaVersion: '1.0',
    },
  };
  try {
    const r = await ebayFetch<{ subscriptionId: string; topicId: string; status: string }>(
      demolitoreid,
      '/commerce/notification/v1/subscription',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    return { subscriptionId: r.subscriptionId, topicId: r.topicId, status: r.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.warn(`Subscribe ${topicId} fallita per demolitore ${demolitoreid}: ${msg}`);
    return null;
  }
}

// Subscribe APPLICATION-scope topic (usa app token) — 1 subscription per tutta l'app
export async function subscribeApplicationTopic(topicId: string): Promise<NotificationSubscription | null> {
  const token = await getAppToken();
  const payload = {
    topicId,
    status: 'ENABLED',
    destination: {
      deliveryConfig: {
        endpoint: getWebhookUrl(),
        verificationToken: getVerificationToken(),
      },
    },
    payload: { format: 'JSON', schemaVersion: '1.0' },
  };
  const r = await fetch(`${getApiBase()}/commerce/notification/v1/subscription`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const text = await r.text();
    console.warn(`Subscribe application ${topicId} fallita: ${r.status} ${text.slice(0, 500)}`);
    return null;
  }
  const data = await r.json();
  return { subscriptionId: data.subscriptionId, topicId: data.topicId, status: data.status };
}

export async function unsubscribeUser(demolitoreid: number, subscriptionId: string): Promise<void> {
  try {
    await ebayFetch(demolitoreid, `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn(`Unsubscribe ${subscriptionId} fallita:`, e);
  }
}
