import { NextRequest, NextResponse } from "next/server";
import { visibleBots } from "@/lib/registry";
import { getTradesForBot, computeAnalytics } from "@/lib/trades";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD or "all"

  const botSummaries = visibleBots.map((bot) => {
    let trades = getTradesForBot(bot.id);
    if (date && date !== "all") {
      trades = trades.filter((t) => t.timestamp.startsWith(date));
    }
    const analytics = computeAnalytics(trades);
    return {
      botId: bot.id,
      name: bot.name,
      ...analytics,
    };
  });

  // Aggregate across all bots
  const totalTrades = botSummaries.reduce((s, b) => s + b.totalTrades, 0);
  const totalWins = botSummaries.reduce((s, b) => s + b.wins, 0);
  const totalLosses = botSummaries.reduce((s, b) => s + b.losses, 0);
  const totalOpen = botSummaries.reduce((s, b) => s + b.open, 0);
  const totalPnl = botSummaries.reduce((s, b) => s + b.totalPnl, 0);

  return NextResponse.json({
    date: date ?? "all",
    aggregate: {
      totalTrades,
      wins: totalWins,
      losses: totalLosses,
      open: totalOpen,
      winRate: totalTrades > 0 ? totalWins / totalTrades : 0,
      totalPnl: Math.round(totalPnl * 10000) / 10000,
    },
    bots: botSummaries,
  });
}
