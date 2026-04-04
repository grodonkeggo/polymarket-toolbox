import { NextRequest, NextResponse } from "next/server";
import { getBotStatus, setBotStatus } from "@/lib/bot-state";
import { getBot } from "@/lib/registry";
import { startBot, stopBot, getBotProcessInfo, getBotLogs, isLocal } from "@/lib/bot-runner";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const bot = getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const processInfo = getBotProcessInfo(botId);

  return NextResponse.json({
    botId,
    status: processInfo.running ? "running" : (getBotStatus(botId) || bot.status),
    canLaunch: isLocal() && !!bot.startCommand,
    process: processInfo,
  });
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
    const result = startBot(botId);
    return NextResponse.json({
      botId,
      status: result.ok ? "running" : (getBotStatus(botId) || bot.status),
      message: result.message,
      ok: result.ok,
    });
  }

  if (action === "stop") {
    const result = stopBot(botId);
    return NextResponse.json({
      botId,
      status: "stopped",
      message: result.message,
      ok: result.ok,
    });
  }

  if (action === "pause") {
    // Pause = stop for now (graceful shutdown)
    const result = stopBot(botId);
    setBotStatus(botId, "idle");
    return NextResponse.json({
      botId,
      status: "idle",
      message: result.message,
      ok: result.ok,
    });
  }

  if (action === "logs") {
    const tail = body.tail ?? 100;
    const logs = getBotLogs(botId, tail);
    return NextResponse.json({ botId, logs });
  }

  return NextResponse.json({ error: "Invalid action. Use: start, stop, pause, logs" }, { status: 400 });
}
