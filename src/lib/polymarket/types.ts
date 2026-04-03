// ── Polymarket CLOB + Gamma API types ──

export interface ClobCredentials {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  privateKey: string;
  proxyWallet?: string;
  signatureType?: 0 | 2; // 0 = EOA, 2 = Gnosis Safe proxy
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  markets: GammaMarket[];
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
}

export interface GammaMarket {
  id: string;
  slug: string;
  question: string;
  conditionId: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  clobTokenIds: string;
}

export interface ClobOrder {
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  type: "FOK" | "GTC" | "GTD";
  feeRateBps?: number;
}

export interface ClobOrderResponse {
  orderID: string;
  status: string;
  transactionsHashes?: string[];
}

export interface MidpointResponse {
  mid: number;
}

export interface OrderbookSnapshot {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: string;
}

export const GAMMA_API_URL = "https://gamma-api.polymarket.com";
export const CLOB_API_URL = "https://clob.polymarket.com";
