// ── Bot state management ──
// Server-side state for bot start/stop.
// In production, this would call out to the actual bot processes.
// For now, holds state in-memory (resets on deploy) to power the UI.

import type { BotStatus } from "./types";

const botStates = new Map<string, BotStatus>();

export function getBotStatus(botId: string): BotStatus {
  return botStates.get(botId) ?? "stopped";
}

export function setBotStatus(botId: string, status: BotStatus): void {
  botStates.set(botId, status);
}

export function getAllBotStatuses(): Record<string, BotStatus> {
  const result: Record<string, BotStatus> = {};
  for (const [id, status] of botStates) {
    result[id] = status;
  }
  return result;
}
