// ── Strategy & Bot Registry ──
// Central catalog of all strategies and bots in the toolbox.
// This is the source of truth the dashboard reads from.

import type { Strategy, Bot } from "./types";

export const strategies: Strategy[] = [
  {
    id: "orb-breakout",
    name: "ORB Breakout",
    description:
      "Opening Range Breakout on BTC 5-min markets. TradingView Pine Script signals → calibrated bucket entry with Kelly sizing.",
    status: "active",
    runtime: "python",
    asset: "crypto",
    tags: ["btc", "5min", "breakout", "tradingview"],
    sourcePath: "strategies/orb-breakout",
    origin: "Polymarket BTC 5min",
    metrics: {
      winRate: 0.72,
      totalTrades: 3624,
      pnl: 0,
      avgReturn: 0.06,
      maxDrawdown: -5,
    },
  },
  {
    id: "momentum-heavy-fav",
    name: "Momentum Heavy Favourite",
    description:
      "Enter BTC/ETH/SOL 5-min markets at 87-90c when underlying has strong directional move. Day/hour/minute filters + mid-market SL.",
    status: "active",
    runtime: "python",
    asset: "crypto",
    tags: ["btc", "eth", "sol", "5min", "momentum"],
    sourcePath: "strategies/momentum-heavy-fav",
    origin: "Polymarket BTC 5min",
    metrics: {
      winRate: 0.961,
      totalTrades: 127,
      pnl: 12.73,
      avgReturn: 0.1,
      maxDrawdown: -5,
    },
  },
  {
    id: "clob-arbitrage",
    name: "CLOB Spread Arbitrage",
    description:
      "Scans CLOB for mispriced outcome pairs, places simultaneous GTC limit orders on both sides to lock in spread profit.",
    status: "paused",
    runtime: "typescript",
    asset: "crypto",
    tags: ["arbitrage", "spread", "market-making"],
    sourcePath: "strategies/clob-arbitrage",
    origin: "Polymarket Crypto Sports arbitrage Tradingbot",
    hidden: true,
  },
  {
    id: "copytrade-momentum",
    name: "Copytrade Momentum",
    description:
      "Resolves live market slugs, uses AdaptivePricePredictor (multi-feature linear regression) to score directional confidence.",
    status: "paused",
    runtime: "typescript",
    asset: "crypto",
    tags: ["copytrade", "momentum", "prediction"],
    sourcePath: "strategies/copytrade-momentum",
    origin: "Polymarket Crypto Sports arbitrage Tradingbot",
  },
  {
    id: "sports-live",
    name: "Sports Live Trading",
    description:
      "Monitors NFL, NBA, soccer markets. WebSocket listener reacts to orderbook spikes at kick-off, halftime, final whistle.",
    status: "draft",
    runtime: "typescript",
    asset: "sports",
    tags: ["sports", "nfl", "nba", "live", "websocket"],
    sourcePath: "strategies/sports-live",
    origin: "Polymarket Crypto Sports arbitrage Tradingbot",
  },
  {
    id: "cross-platform-arb",
    name: "Cross-Platform Arbitrage",
    description:
      "Detects price discrepancies between Polymarket, Kalshi, and other prediction markets on the same events.",
    status: "draft",
    runtime: "javascript",
    asset: "custom",
    tags: ["arbitrage", "kalshi", "cross-platform"],
    sourcePath: "strategies/cross-platform-arb",
    origin: "PredictionMarket Arbitrage",
    hidden: true,
  },
  {
    id: "wallet-copytrade",
    name: "Wallet Intelligence Copytrade",
    description:
      "Signal Score leaderboard (0-100) ranks top wallets. Discord alerts when ELITE wallets execute trades. Mirror dominant positions.",
    status: "draft",
    runtime: "javascript",
    asset: "custom",
    tags: ["copytrade", "wallet-scanner", "signals"],
    sourcePath: "strategies/wallet-copytrade",
    origin: "PredictionMarket Arbitrage",
  },
  {
    id: "late-entry-v3",
    name: "Late Entry V3 (4coinsbot)",
    description:
      "Enters 15-min crypto markets in the last 4 minutes on the favourite side. Parallel WebSocket feeds for BTC/ETH/SOL/XRP with confidence threshold, flip-stop, and time-scaled sizing.",
    status: "active",
    runtime: "python",
    asset: "crypto",
    tags: ["btc", "eth", "sol", "xrp", "15min", "late-entry", "websocket", "4coins"],
    sourcePath: "bots/4coinsbot",
    origin: "github:txbabaxyz/4coinsbot",
    metrics: {
      winRate: 0,
      totalTrades: 0,
      pnl: 0,
      avgReturn: 0,
      maxDrawdown: -12,
    },
  },
];

export const bots: Bot[] = [
  {
    id: "orb-bot",
    name: "ORB Bot",
    description: "FastAPI webhook server for ORB Breakout strategy",
    status: "stopped",
    strategyId: "orb-breakout",
    runtime: "python",
    endpoint: "http://localhost:8000",
    startCommand: "python -m uvicorn main:app --host 0.0.0.0 --port 8000",
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket BTC 5min/server",
    config: {
      stakeUsdc: 1,
      maxTradesPerHour: 10,
      dailyLossLimit: -5,
      assets: ["btc"],
    },
  },
  {
    id: "momentum-bot",
    name: "Momentum Bot",
    description:
      "30s scanner + 5s position monitor for heavy-favourite momentum entries",
    status: "stopped",
    strategyId: "momentum-heavy-fav",
    runtime: "python",
    endpoint: "http://localhost:8000",
    startCommand: "python momentum_bot.py",
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket BTC 5min/server",
    config: {
      stakeUsdc: 1,
      maxTradesPerHour: 20,
      dailyLossLimit: -5,
      assets: ["btc", "eth", "sol"],
    },
  },
  {
    id: "arb-bot",
    name: "Arbitrage Bot",
    description: "CLOB spread scanner with simultaneous order placement",
    status: "stopped",
    strategyId: "clob-arbitrage",
    runtime: "typescript",
    hidden: true,
    config: {
      stakeUsdc: 5,
      maxTradesPerHour: 50,
      dailyLossLimit: -10,
      assets: ["btc", "eth"],
    },
  },
  {
    id: "4coinsbot",
    name: "4coinsbot",
    description:
      "Late Entry V3 — parallel 15-min crypto trader with WebSocket feeds, time-scaled sizing, flip-stop, and Telegram notifications",
    status: "stopped",
    strategyId: "late-entry-v3",
    runtime: "python",
    startCommand: "python main.py",
    cwd: "C:/Users/bapti/Documents/AI/Trading/polymarket-toolbox/bots/4coinsbot/src",
    config: {
      stakeUsdc: 1,
      maxTradesPerHour: 16,
      dailyLossLimit: -5,
      assets: ["btc", "eth", "sol", "xrp"],
    },
  },
];

// ── Filtered lists (exclude hidden) ──

export const visibleStrategies = strategies.filter((s) => !s.hidden);
export const visibleBots = bots.filter((b) => !b.hidden);

// ── Lookup helpers ──

export function getStrategy(id: string): Strategy | undefined {
  return strategies.find((s) => s.id === id);
}

export function getBot(id: string): Bot | undefined {
  return bots.find((b) => b.id === id);
}

export function getBotsForStrategy(strategyId: string): Bot[] {
  return visibleBots.filter((b) => b.strategyId === strategyId);
}

export function getStrategiesByAsset(asset: string): Strategy[] {
  return visibleStrategies.filter((s) => s.asset === asset);
}

export function getStrategiesByTag(tag: string): Strategy[] {
  return visibleStrategies.filter((s) => s.tags.includes(tag));
}
