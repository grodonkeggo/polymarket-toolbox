import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/lib/registry";
import { getTradesForBot, computeAnalytics } from "@/lib/trades";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const bot = getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD or "all"

  let trades = getTradesForBot(botId);

  // Filter by date if provided
  if (date && date !== "all") {
    trades = trades.filter((t) => t.timestamp.startsWith(date));
  }

  const analytics = computeAnalytics(trades);

  return NextResponse.json({ botId, trades, analytics, date: date ?? "all" });
}
