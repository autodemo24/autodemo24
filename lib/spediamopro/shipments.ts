import { spediamoFetch, spediamoFetchBinary } from './client';

export async function getShipment(demolitoreid: number, shipmentId: string) {
  return spediamoFetch(demolitoreid, `/shipments/${encodeURIComponent(shipmentId)}`);
}

export async function getShipmentLabel(demolitoreid: number, shipmentId: string) {
  return spediamoFetchBinary(demolitoreid, `/shipments/${encodeURIComponent(shipmentId)}/labels`);
}

export async function getTracking(demolitoreid: number, shipmentId: string) {
  return spediamoFetch(demolitoreid, `/shipments/${encodeURIComponent(shipmentId)}/tracking`);
}
