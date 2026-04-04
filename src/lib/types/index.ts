// ── Core domain types for the Polymarket Toolbox ──

export type StrategyStatus = "active" | "paused" | "backtest" | "draft";
export type BotStatus = "running" | "stopped" | "error" | "idle";
export type AssetType = "crypto" | "sports" | "politics" | "custom";
export type StrategyRuntime = "python" | "typescript" | "javascript";

export interface Strategy {
  id: string;
  name: string;
  description: string;
  status: StrategyStatus;
  runtime: StrategyRuntime;
  asset: AssetType;
  tags: string[];
  /** Path to the strategy source (relative to repo root) */
  sourcePath: string;
  /** Which existing project this was imported from, if any */
  origin?: string;
  /** Hidden from UI but kept in registry for reference */
  hidden?: boolean;
  metrics?: StrategyMetrics;
  config?: Record<string, unknown>;
}

export interface StrategyMetrics {
  winRate: number;
  totalTrades: number;
  pnl: number;
  avgReturn: number;
  maxDrawdown: number;
  sharpe?: number;
  lastRun?: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  status: BotStatus;
  strategyId: string;
  runtime: StrategyRuntime;
  /** Endpoint or process info for the running bot */
  endpoint?: string;
  /** Shell command to start this bot */
  startCommand?: string;
  /** Working directory for the start command */
  cwd?: string;
  /** Hidden from UI but kept in registry for reference */
  hidden?: boolean;
  config: BotConfig;
  stats?: BotStats;
}

export interface BotConfig {
  stakeUsdc: number;
  maxTradesPerHour: number;
  dailyLossLimit: number;
  assets: string[];
  [key: string]: unknown;
}

export interface BotStats {
  uptime: string;
  tradestoday: number;
  pnlToday: number;
  winRateToday: number;
  lastTrade?: string;
}

// ── Polymarket API types ──

export interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  liquidity: number;
  endDate: string;
  active: boolean;
  category: string;
  conditionId: string;
  tokens: TokenPair[];
}

export interface TokenPair {
  token_id: string;
  outcome: string;
  price: number;
}

export interface TradeSignal {
  timestamp: string;
  strategyId: string;
  market: string;
  direction: "buy" | "sell";
  outcome: string;
  confidence: number;
  price: number;
  stake: number;
  reason: string;
}

export interface TradeResult {
  id: string;
  signal: TradeSignal;
  status: "filled" | "partial" | "rejected" | "pending";
  fillPrice: number;
  fillAmount: number;
  pnl?: number;
  resolvedAt?: string;
}
