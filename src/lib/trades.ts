// ── Trade history & analytics engine ──
// Reads real JSONL trade logs from existing bot projects.
// Falls back to empty arrays when log files aren't found.

import { readFileSync, existsSync } from "fs";
import path from "path";

export interface Trade {
  id: string;
  botId: string;
  timestamp: string;
  market: string;
  asset: string;
  direction: "buy" | "sell";
  outcome: "UP" | "DOWN";
  entryPrice: number;
  exitPrice: number | null;
  contracts: number;
  pnl: number | null;
  status: "open" | "won" | "lost" | "stopped";
  dryRun: boolean;
  resolution?: string;
  /** Extra fields preserved from the source log */
  meta?: Record<string, unknown>;
}

export interface BotAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestTrade: number;
  worstTrade: number;
  maxDrawdown: number;
  streak: { current: number; type: "win" | "loss" };
  byAsset: Record<string, { trades: number; pnl: number; winRate: number }>;
  pnlCurve: Array<{ timestamp: string; cumPnl: number }>;
}

// ── JSONL file locations (configurable via env) ──

const LOG_PATHS: Record<string, string[]> = {
  "scanner-bot": [
    process.env.SCANNER_TRADES_PATH ?? "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/orb-bot/scanner_trades.jsonl",
  ],
  "momentum-bot": [
    process.env.MOMENTUM_TRADES_PATH ?? "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/momentum-bot/momentum_live_trades.jsonl",
  ],
  "arb-bot": [
    process.env.ARB_SIGNALS_PATH ?? "",
  ],
  "scalper-bot": [
    process.env.SCALPER_TRADES_PATH ?? "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/scalper-bot/scalper_trades.jsonl",
  ],
  "4coinsbot": [
    // 4coinsbot logs to logs/trades.jsonl at runtime — check both local and source locations
    process.env.FOURCOINS_TRADES_PATH ?? "",
  ],
};

// ── JSONL reader ──

function readJsonl<T>(filePath: string, maxLines = 5000): T[] {
  if (!filePath || !existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");
    // Take last N lines for performance on large files
    const slice = lines.slice(-maxLines);
    const results: T[] = [];
    for (const line of slice) {
      if (!line.trim()) continue;
      try {
        results.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ── Format-specific parsers ──

interface OrbTradeRaw {
  time: string;
  side: string;
  conf: number;
  delta: number;
  btc_price: number;
  mkt_price: number;
  edge: number;
  stake: number;
  question: string;
  market_id: string;
  token_id: string;
  end_ts: number;
  bucket_wr: number;
  outcome: string;
  pnl: number | null;
  order?: {
    orderID?: string;
    fill_usdc?: number;
    fill_shares?: number;
    status?: string;
    dry_run?: boolean;
  };
  dry_run?: boolean;
  event: string;
}

function parseOrbTrades(filePath: string): Trade[] {
  const raw = readJsonl<OrbTradeRaw>(filePath);
  // Group by entry events, merge outcome events
  const entryMap = new Map<string, Trade>();

  for (const r of raw) {
    const key = `${r.market_id}-${r.end_ts}`;

    if (r.event === "entry") {
      entryMap.set(key, {
        id: r.order?.orderID ?? key,
        botId: "orb-bot",
        timestamp: r.time,
        market: r.question ?? `BTC-5MIN-${r.end_ts}`,
        asset: "BTC",
        direction: "buy",
        outcome: r.side?.toUpperCase() as "UP" | "DOWN",
        entryPrice: r.mkt_price,
        exitPrice: null,
        contracts: r.order?.fill_shares ?? Math.round(r.stake / r.mkt_price),
        pnl: null,
        status: "open",
        dryRun: !!(r.dry_run || r.order?.dry_run),
        meta: { conf: r.conf, delta: r.delta, btcPrice: r.btc_price, bucketWr: r.bucket_wr, edge: r.edge },
      });
    } else if (r.event === "outcome" || r.event === "mid_sl_exit" || r.event === "mid_tp_exit") {
      const existing = entryMap.get(key);
      if (existing) {
        existing.pnl = r.pnl;
        const won = r.outcome === "won" || r.outcome === "mid_tp";
        const lost = r.outcome === "lost" || r.outcome === "mid_sl";
        existing.exitPrice = won ? 1.0 : 0;
        existing.status = won ? "won" : lost ? "lost" : "open";
      }
    }
  }

  return Array.from(entryMap.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

interface MomentumTradeRaw {
  asset: string;
  direction: string;
  market_key: string;
  market_id: string;
  token_id: string;
  question: string;
  entry_price: number;
  stake: number;
  fill_usdc: number;
  fill_shares: number;
  end_ts: number;
  placed_at: string;
  order_id: string;
  outcome: string | null;
  pnl: number | null;
  dry_run?: boolean;
  event: string;
}

function parseMomentumTrades(filePath: string): Trade[] {
  const raw = readJsonl<MomentumTradeRaw>(filePath);
  const entryMap = new Map<string, Trade>();

  for (const r of raw) {
    const key = r.market_key ?? `${r.asset}-${r.end_ts}`;

    if (r.event === "entry") {
      entryMap.set(key, {
        id: r.order_id ?? key,
        botId: "momentum-bot",
        timestamp: r.placed_at,
        market: r.question ?? `${r.asset}-5MIN`,
        asset: (r.asset ?? "BTC").toUpperCase(),
        direction: "buy",
        outcome: (r.direction ?? "up").toUpperCase() as "UP" | "DOWN",
        entryPrice: r.entry_price,
        exitPrice: null,
        contracts: r.fill_shares ?? Math.round(r.stake / r.entry_price),
        pnl: null,
        status: "open",
        dryRun: !!r.dry_run,
        meta: { fillUsdc: r.fill_usdc, fillShares: r.fill_shares },
      });
    } else if (r.event === "outcome" || r.event === "mid_sl_exit" || r.event === "mid_tp_exit") {
      const existing = entryMap.get(key);
      if (existing) {
        existing.pnl = r.pnl;
        const won = r.outcome === "won" || r.outcome === "mid_tp";
        const lost = r.outcome === "lost" || r.outcome === "mid_sl";
        existing.exitPrice = won ? 1.0 : 0;
        existing.status = won ? "won" : lost ? "lost" : "open";
      }
    }
  }

  return Array.from(entryMap.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

interface BotSignalRaw {
  type: string;
  slot: number;
  market: string;
  side: string;
  signal: string;
  confidence: number;
  entryPrice: number;
  timestamp: string;
  outcome: string;
  correct: boolean;
}

function parseBotSignals(filePath: string): Trade[] {
  const raw = readJsonl<BotSignalRaw>(filePath, 2000);
  return raw
    .filter((r) => r.type === "signal")
    .map((r, i) => ({
      id: `arb-signal-${r.slot}-${i}`,
      botId: "arb-bot",
      timestamp: r.timestamp,
      market: `${r.market}-SIGNAL-${r.slot}`,
      asset: (r.market ?? "BTC").toUpperCase(),
      direction: "buy" as const,
      outcome: (r.side ?? "up").toUpperCase() as "UP" | "DOWN",
      entryPrice: r.entryPrice,
      exitPrice: r.correct ? 1.0 : 0,
      contracts: 1,
      pnl: r.correct ? +(1.0 - r.entryPrice).toFixed(4) : +(-r.entryPrice).toFixed(4),
      status: (r.correct ? "won" : "lost") as "won" | "lost",
      dryRun: false,
      meta: { confidence: r.confidence, signal: r.signal },
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// ── Public API ──

export function getTradesForBot(botId: string): Trade[] {
  const paths = LOG_PATHS[botId] ?? [];

  switch (botId) {
    case "scanner-bot":
      return paths.flatMap((p) => parseMomentumTrades(p));
    case "scalper-bot":
      return paths.flatMap((p) => parseMomentumTrades(p));
    case "momentum-bot":
      return paths.flatMap((p) => parseMomentumTrades(p));
    case "arb-bot":
      return paths.flatMap((p) => parseBotSignals(p));
    case "4coinsbot": {
      // 4coinsbot doesn't have logs yet — return empty until it runs
      const p = paths[0];
      if (p && existsSync(p)) {
        // Future: parse 4coinsbot's trades.jsonl format
        return [];
      }
      return [];
    }
    default:
      return [];
  }
}

// ── Analytics computation ──

export function computeAnalytics(trades: Trade[]): BotAnalytics {
  const resolved = trades.filter((t) => t.status === "won" || t.status === "lost" || t.status === "stopped");
  const openTrades = trades.filter((t) => t.status === "open");
  const wins = resolved.filter((t) => t.status === "won");
  const losses = resolved.filter((t) => t.status === "lost" || t.status === "stopped");

  const pnls = resolved.map((t) => t.pnl ?? 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
  const totalPnl = pnls.reduce((s, p) => s + p, 0);

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cum = 0;
  for (const p of pnls) {
    cum += p;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Current streak
  let streakType: "win" | "loss" = "win";
  let streakCount = 0;
  for (let i = resolved.length - 1; i >= 0; i--) {
    const t = resolved[i];
    const isWin = t.status === "won";
    if (i === resolved.length - 1) {
      streakType = isWin ? "win" : "loss";
      streakCount = 1;
    } else if ((isWin && streakType === "win") || (!isWin && streakType === "loss")) {
      streakCount++;
    } else {
      break;
    }
  }

  // By asset
  const byAsset: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of resolved) {
    if (!byAsset[t.asset]) byAsset[t.asset] = { trades: 0, pnl: 0, winRate: 0 };
    byAsset[t.asset].trades++;
    byAsset[t.asset].pnl += t.pnl ?? 0;
  }
  for (const asset of Object.keys(byAsset)) {
    const assetWins = resolved.filter((t) => t.asset === asset && t.status === "won").length;
    byAsset[asset].winRate = byAsset[asset].trades > 0 ? assetWins / byAsset[asset].trades : 0;
  }

  // PnL curve
  let runningPnl = 0;
  const pnlCurve = resolved.map((t) => {
    runningPnl += t.pnl ?? 0;
    return { timestamp: t.timestamp, cumPnl: runningPnl };
  });

  return {
    totalTrades: resolved.length,
    wins: wins.length,
    losses: losses.length,
    open: openTrades.length,
    winRate: resolved.length > 0 ? wins.length / resolved.length : 0,
    totalPnl,
    avgPnl: resolved.length > 0 ? totalPnl / resolved.length : 0,
    bestTrade,
    worstTrade,
    maxDrawdown: -maxDrawdown,
    streak: { current: streakCount, type: streakType },
    byAsset,
    pnlCurve,
  };
}
