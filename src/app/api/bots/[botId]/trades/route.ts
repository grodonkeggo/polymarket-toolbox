import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/lib/registry";
import { getTradesForBot, computeAnalytics } from "@/lib/trades";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const bot = getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const trades = getTradesForBot(botId);
  const analytics = computeAnalytics(trades);

  return NextResponse.json({ botId, trades, analytics });
}
