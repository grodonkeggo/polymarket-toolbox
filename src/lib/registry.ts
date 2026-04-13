// ── Strategy & Bot Registry ──
// Central catalog of all strategies and bots in the toolbox.
// This is the source of truth the dashboard reads from.

import type { Strategy, Bot } from "./types";

export const strategies: Strategy[] = [
  {
    id: "confirmed-momentum",
    name: "Confirmed Momentum Scanner",
    description:
      "Self-scanning 5-min strategy with multi-signal confirmation: Binance delta + volume surge (1.3x) + trend continuation + CLOB orderbook imbalance. Enters at 85-92c after 90s+ confirmation.",
    status: "active",
    runtime: "python",
    asset: "crypto",
    tags: ["btc", "eth", "sol", "5min", "scanner", "volume", "orderbook"],
    sourcePath: "bots/orb-bot/scanner_bot.py",
    origin: "Replaces ORB Breakout",
    metrics: {
      winRate: 0,
      totalTrades: 0,
      pnl: 0,
      avgReturn: 0,
      maxDrawdown: 0,
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
    id: "dip-scalper",
    name: "Favourite Dip Scalper",
    description:
      "Buys the favourite after a 15c+ dip from peak. Backtest: 388 signals, 100% TP hit rate, avg 32.7c recovery. TP at +5c, wide 35c SL.",
    status: "active",
    runtime: "python",
    asset: "crypto",
    tags: ["btc", "eth", "sol", "5min", "scalper", "dip", "mean-reversion"],
    sourcePath: "bots/scalper-bot/scalper_bot.py",
    origin: "Data-driven (52K snapshot analysis)",
    metrics: {
      winRate: 0,
      totalTrades: 0,
      pnl: 0,
      avgReturn: 0,
      maxDrawdown: 0,
    },
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
    id: "scanner-bot",
    name: "Scanner Bot",
    description:
      "Confirmed Momentum Scanner — self-scanning BTC/ETH/SOL with delta + volume surge + orderbook imbalance + trend confirmation",
    status: "stopped",
    strategyId: "confirmed-momentum",
    runtime: "python",
    startCommand: "python scanner_bot.py",
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/orb-bot",
    config: {
      stakeUsdc: 1,
      maxTradesPerHour: 10,
      dailyLossLimit: -5,
      assets: ["btc", "eth", "sol"],
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
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/momentum-bot",
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
    id: "scalper-bot",
    name: "Scalper Bot",
    description:
      "Favourite Dip Scalper — buys the favourite after 15c+ dip from peak, TP at +5c recovery",
    status: "stopped",
    strategyId: "dip-scalper",
    runtime: "python",
    startCommand: "python scalper_bot.py",
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/bots/scalper-bot",
    config: {
      stakeUsdc: 1,
      maxTradesPerHour: 20,
      dailyLossLimit: -5,
      assets: ["btc", "eth", "sol"],
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
    cwd: "C:/Users/bapti/Documents/AI/Trading/Polymarket Tools/toolbox/bots/4coinsbot/src",
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
