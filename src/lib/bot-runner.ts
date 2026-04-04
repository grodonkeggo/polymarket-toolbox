// ── Bot Process Runner ──
// Spawns and manages real bot processes from the dashboard.
// Only works when running locally (not on Vercel serverless).

import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { getBot } from "./registry";
import { setBotStatus, getBotStatus } from "./bot-state";

interface RunningBot {
  process: ChildProcess;
  pid: number;
  startedAt: string;
  logs: string[];
}

const MAX_LOG_LINES = 500;
const runningBots = new Map<string, RunningBot>();

export function isLocal(): boolean {
  return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
}

export function startBot(botId: string): { ok: boolean; message: string } {
  if (!isLocal()) {
    return { ok: false, message: "Bot launching only available when running locally" };
  }

  if (runningBots.has(botId)) {
    return { ok: false, message: "Bot is already running" };
  }

  const bot = getBot(botId);
  if (!bot) return { ok: false, message: "Bot not found" };
  if (!bot.startCommand) return { ok: false, message: "No start command configured for this bot" };
  if (!bot.cwd || !existsSync(bot.cwd)) {
    return { ok: false, message: `Working directory not found: ${bot.cwd}` };
  }

  const parts = bot.startCommand.split(" ");
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    const child = spawn(cmd, args, {
      cwd: bot.cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      env: {
        ...process.env,
        PYTHONUTF8: "1",
        PYTHONIOENCODING: "utf-8",
        // Default to dry-run for safety — set DRY_RUN=false in .env to go live
        DRY_RUN: process.env.DRY_RUN ?? "true",
      },
    });

    const logs: string[] = [];

    const appendLog = (source: string, data: Buffer) => {
      const lines = data.toString().split("\n").filter((l) => l.trim());
      for (const line of lines) {
        logs.push(`[${source}] ${line}`);
        if (logs.length > MAX_LOG_LINES) logs.shift();
      }
    };

    child.stdout?.on("data", (data) => appendLog("stdout", data));
    child.stderr?.on("data", (data) => appendLog("stderr", data));

    child.on("exit", (code) => {
      logs.push(`[system] Process exited with code ${code}`);
      runningBots.delete(botId);
      setBotStatus(botId, "stopped");
    });

    child.on("error", (err) => {
      logs.push(`[system] Process error: ${err.message}`);
      runningBots.delete(botId);
      setBotStatus(botId, "error");
    });

    runningBots.set(botId, {
      process: child,
      pid: child.pid ?? 0,
      startedAt: new Date().toISOString(),
      logs,
    });

    setBotStatus(botId, "running");
    return { ok: true, message: `${bot.name} started (PID: ${child.pid})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Failed to start: ${msg}` };
  }
}

export function stopBot(botId: string): { ok: boolean; message: string } {
  const running = runningBots.get(botId);
  if (!running) {
    setBotStatus(botId, "stopped");
    return { ok: true, message: "Bot was not running" };
  }

  try {
    running.process.kill("SIGTERM");
    // Give it 5s to gracefully shut down, then force kill
    setTimeout(() => {
      if (runningBots.has(botId)) {
        running.process.kill("SIGKILL");
        runningBots.delete(botId);
        setBotStatus(botId, "stopped");
      }
    }, 5000);

    return { ok: true, message: `Stopping bot (PID: ${running.pid})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runningBots.delete(botId);
    setBotStatus(botId, "stopped");
    return { ok: false, message: `Error stopping: ${msg}` };
  }
}

export function getBotLogs(botId: string, tail = 100): string[] {
  const running = runningBots.get(botId);
  if (!running) return [];
  return running.logs.slice(-tail);
}

export function getBotProcessInfo(botId: string): {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  logCount: number;
} {
  const running = runningBots.get(botId);
  if (!running) {
    return { running: false, pid: null, startedAt: null, logCount: 0 };
  }
  return {
    running: true,
    pid: running.pid,
    startedAt: running.startedAt,
    logCount: running.logs.length,
  };
}
