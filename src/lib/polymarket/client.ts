// ── Polymarket API client (read-only for dashboard, mirrors existing auth patterns) ──

import {
  GAMMA_API_URL,
  CLOB_API_URL,
  type GammaEvent,
  type GammaMarket,
  type MidpointResponse,
  type OrderbookSnapshot,
} from "./types";

/**
 * Read-only Polymarket client for the dashboard.
 * No private key needed — just fetches public market data.
 * Trading operations are handled by the individual bots.
 */
export class PolymarketClient {
  private gammaUrl: string;
  private clobUrl: string;

  constructor(
    gammaUrl = GAMMA_API_URL,
    clobUrl = CLOB_API_URL,
  ) {
    this.gammaUrl = gammaUrl;
    this.clobUrl = clobUrl;
  }

  // ── Gamma API (market discovery) ──

  async getEvents(params?: {
    slug?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<GammaEvent[]> {
    const query = new URLSearchParams();
    if (params?.slug) query.set("slug", params.slug);
    if (params?.active !== undefined) query.set("active", String(params.active));
    if (params?.limit) query.set("_limit", String(params.limit));
    if (params?.offset) query.set("_offset", String(params.offset));

    const res = await fetch(`${this.gammaUrl}/events?${query}`);
    if (!res.ok) throw new Error(`Gamma /events failed: ${res.status}`);
    return res.json();
  }

  async getMarketBySlug(slug: string): Promise<GammaMarket[]> {
    const res = await fetch(`${this.gammaUrl}/markets/slug/${slug}`);
    if (!res.ok) throw new Error(`Gamma /markets/slug failed: ${res.status}`);
    return res.json();
  }

  async getMarkets(params?: {
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<GammaMarket[]> {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set("active", String(params.active));
    if (params?.limit) query.set("_limit", String(params.limit));
    if (params?.offset) query.set("_offset", String(params.offset));

    const res = await fetch(`${this.gammaUrl}/markets?${query}`);
    if (!res.ok) throw new Error(`Gamma /markets failed: ${res.status}`);
    return res.json();
  }

  // ── CLOB API (price feeds, orderbook — public endpoints) ──

  async getMidpoint(tokenId: string): Promise<number> {
    const res = await fetch(`${this.clobUrl}/midpoint?token_id=${tokenId}`);
    if (!res.ok) throw new Error(`CLOB /midpoint failed: ${res.status}`);
    const data: MidpointResponse = await res.json();
    return data.mid;
  }

  async getOrderbook(tokenId: string): Promise<OrderbookSnapshot> {
    const res = await fetch(`${this.clobUrl}/book?token_id=${tokenId}`);
    if (!res.ok) throw new Error(`CLOB /book failed: ${res.status}`);
    return res.json();
  }

  // ── Convenience helpers ──

  async getActiveCryptoMarkets(asset: string = "btc"): Promise<GammaMarket[]> {
    const events = await this.getEvents({ active: true, limit: 50 });
    const cryptoEvents = events.filter(
      (e) =>
        e.slug?.toLowerCase().includes(asset.toLowerCase()) &&
        e.slug?.includes("updown"),
    );
    return cryptoEvents.flatMap((e) => e.markets);
  }

  async getMarketPrices(
    market: GammaMarket,
  ): Promise<{ yes: number; no: number }> {
    const tokenIds = JSON.parse(market.clobTokenIds || "[]") as string[];
    if (tokenIds.length < 2) return { yes: 0, no: 0 };

    const [yesMid, noMid] = await Promise.all([
      this.getMidpoint(tokenIds[0]),
      this.getMidpoint(tokenIds[1]),
    ]);

    return { yes: yesMid, no: noMid };
  }
}

/** Singleton for server-side usage */
let _client: PolymarketClient | null = null;

export function getPolymarketClient(): PolymarketClient {
  if (!_client) {
    _client = new PolymarketClient();
  }
  return _client;
}
