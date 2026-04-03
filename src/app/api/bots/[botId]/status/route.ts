import { NextRequest, NextResponse } from "next/server";
import { getBotStatus, setBotStatus } from "@/lib/bot-state";
import { getBot } from "@/lib/registry";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const bot = getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  return NextResponse.json({ botId, status: getBotStatus(botId) || bot.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const bot = getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const body = await req.json();
  const action = body.action as string;

  if (action === "start") {
    setBotStatus(botId, "running");
    return NextResponse.json({ botId, status: "running", message: `${bot.name} started` });
  }

  if (action === "stop") {
    setBotStatus(botId, "stopped");
    return NextResponse.json({ botId, status: "stopped", message: `${bot.name} stopped` });
  }

  if (action === "pause") {
    setBotStatus(botId, "idle");
    return NextResponse.json({ botId, status: "idle", message: `${bot.name} paused` });
  }

  return NextResponse.json({ error: "Invalid action. Use: start, stop, pause" }, { status: 400 });
}
