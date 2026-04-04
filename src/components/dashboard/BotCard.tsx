"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bot } from "@/lib/types";
import { getStrategy } from "@/lib/registry";
import StatusBadge from "@/components/ui/StatusBadge";

type LiveStatus = "running" | "stopped" | "idle" | "error";

export default function BotCard({ bot }: { bot: Bot }) {
  const strategy = getStrategy(bot.strategyId);
  const [status, setStatus] = useState<LiveStatus>(bot.status as LiveStatus);
  const [busy, setBusy] = useState(false);

  const sendAction = async (e: React.MouseEvent, action: "start" | "stop") => {
    e.preventDefault(); // Don't navigate when clicking buttons
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await fetch(`/api/bots/${bot.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
    } finally {
      setBusy(false);
    }
  };

  const statusColor =
    status === "running"
      ? "var(--accent-green)"
      : status === "error"
        ? "var(--accent-red)"
        : "var(--text-muted)";

  return (
    <Link
      href={`/bots/${bot.id}`}
      className="block rounded-xl border p-4 transition-colors hover:border-[var(--border-accent)] cursor-pointer"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {bot.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {bot.runtime} &middot; {strategy?.name ?? bot.strategyId}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
          style={{
            background: status === "running" ? "var(--accent-green-dim)" : status === "error" ? "var(--accent-red-dim)" : "rgba(138,150,168,0.1)",
            color: statusColor,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
          {status}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {bot.description}
      </p>

      <div
        className="grid grid-cols-2 gap-3 pt-3 border-t text-xs"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <span style={{ color: "var(--text-muted)" }}>Stake: </span>
          <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
            ${bot.config.stakeUsdc}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Max/hr: </span>
          <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
            {bot.config.maxTradesPerHour}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Loss limit: </span>
          <span className="font-mono font-medium" style={{ color: "var(--accent-red)" }}>
            ${bot.config.dailyLossLimit}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Assets: </span>
          <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
            {bot.config.assets.join(", ")}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="mt-3 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--accent-blue)" }}
        >
          Trades &amp; analytics &rarr;
        </span>
        <div className="flex gap-1.5">
          {status !== "running" ? (
            <button
              onClick={(e) => sendAction(e, "start")}
              disabled={busy}
              className="px-3 py-1 rounded-md text-[11px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}
            >
              {busy ? "..." : "Start"}
            </button>
          ) : (
            <button
              onClick={(e) => sendAction(e, "stop")}
              disabled={busy}
              className="px-3 py-1 rounded-md text-[11px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}
            >
              {busy ? "..." : "Stop"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
