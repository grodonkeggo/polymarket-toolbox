// ── Trade history & analytics engine ──
// In production this reads from JSONL logs or a database.
// For now, provides typed interfaces + mock data for the dashboard.

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
  resolution?: string;
}

export interface BotAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
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

export function computeAnalytics(trades: Trade[]): BotAnalytics {
  const resolved = trades.filter((t) => t.status === "won" || t.status === "lost" || t.status === "stopped");
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

// ── Mock trade data (replaced by real JSONL ingestion later) ──

function mockTrades(botId: string, asset: string, count: number): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const isWin = Math.random() > 0.3;
    const entry = 0.85 + Math.random() * 0.07;
    const pnl = isWin
      ? +(Math.random() * 0.15 + 0.02).toFixed(4)
      : +(-Math.random() * 0.8 - 0.05).toFixed(4);
    trades.push({
      id: `${botId}-${asset}-${i}`,
      botId,
      timestamp: new Date(now - (count - i) * 15 * 60 * 1000).toISOString(),
      market: `${asset.toUpperCase()}-UPDOWN-15MIN`,
      asset: asset.toUpperCase(),
      direction: "buy",
      outcome: Math.random() > 0.5 ? "UP" : "DOWN",
      entryPrice: +entry.toFixed(4),
      exitPrice: isWin ? 1.0 : +(entry - Math.random() * 0.3).toFixed(4),
      contracts: Math.floor(Math.random() * 4) + 8,
      pnl,
      status: isWin ? "won" : "lost",
    });
  }
  return trades;
}

export function getTradesForBot(botId: string): Trade[] {
  switch (botId) {
    case "orb-bot":
      return mockTrades("orb-bot", "btc", 40);
    case "momentum-bot":
      return [
        ...mockTrades("momentum-bot", "btc", 20),
        ...mockTrades("momentum-bot", "eth", 15),
        ...mockTrades("momentum-bot", "sol", 10),
      ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    case "arb-bot":
      return mockTrades("arb-bot", "btc", 25);
    case "4coinsbot":
      return [
        ...mockTrades("4coinsbot", "btc", 15),
        ...mockTrades("4coinsbot", "eth", 12),
        ...mockTrades("4coinsbot", "sol", 10),
        ...mockTrades("4coinsbot", "xrp", 8),
      ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    default:
      return [];
  }
}
