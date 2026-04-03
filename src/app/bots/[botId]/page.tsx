"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Trade, BotAnalytics } from "@/lib/trades";
import { bots } from "@/lib/registry";
import { getStrategy } from "@/lib/registry";

type BotStatus = "running" | "stopped" | "idle" | "error";

export default function BotDetailPage() {
  const { botId } = useParams<{ botId: string }>();
  const bot = bots.find((b) => b.id === botId);
  const strategy = bot ? getStrategy(bot.strategyId) : undefined;

  const [status, setStatus] = useState<BotStatus>(
    (bot?.status as BotStatus) ?? "stopped",
  );
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!botId) return;
    try {
      const res = await fetch(`/api/bots/${botId}/trades`);
      const data = await res.json();
      setTrades(data.trades ?? []);
      setAnalytics(data.analytics ?? null);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  const fetchStatus = useCallback(async () => {
    if (!botId) return;
    const res = await fetch(`/api/bots/${botId}/status`);
    const data = await res.json();
    if (data.status) setStatus(data.status);
  }, [botId]);

  useEffect(() => {
    fetchTrades();
    fetchStatus();
  }, [fetchTrades, fetchStatus]);

  const sendAction = async (action: "start" | "stop" | "pause") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
    } finally {
      setActionLoading(false);
    }
  };

  if (!bot) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
        Bot not found.{" "}
        <Link href="/bots" className="underline" style={{ color: "var(--accent-blue)" }}>
          Back to bots
        </Link>
      </div>
    );
  }

  const statusColor =
    status === "running"
      ? "var(--accent-green)"
      : status === "idle"
        ? "var(--accent-yellow)"
        : status === "error"
          ? "var(--accent-red)"
          : "var(--text-muted)";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/bots"
          className="text-xs px-2 py-1 rounded"
          style={{ color: "var(--text-secondary)", background: "var(--bg-card)" }}
        >
          &larr; Bots
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {bot.name}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                background: status === "running" ? "var(--accent-green-dim)" : status === "idle" ? "var(--accent-yellow-dim)" : "rgba(138,150,168,0.1)",
                color: statusColor,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
              {status}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {bot.description}
          </p>
          {strategy && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Strategy: {strategy.name} &middot; {bot.runtime} &middot; {bot.config.assets.join(", ").toUpperCase()}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {status !== "running" && (
            <button
              onClick={() => sendAction("start")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}
            >
              {actionLoading ? "..." : "Start"}
            </button>
          )}
          {status === "running" && (
            <button
              onClick={() => sendAction("pause")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-yellow-dim)", color: "var(--accent-yellow)" }}
            >
              {actionLoading ? "..." : "Pause"}
            </button>
          )}
          {status !== "stopped" && (
            <button
              onClick={() => sendAction("stop")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}
            >
              {actionLoading ? "..." : "Stop"}
            </button>
          )}
        </div>
      </div>

      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Trades" value={String(analytics.totalTrades)} />
          <StatCard label="Win Rate" value={`${(analytics.winRate * 100).toFixed(1)}%`} accent={analytics.winRate >= 0.5 ? "green" : "red"} />
          <StatCard label="Total PnL" value={`$${analytics.totalPnl.toFixed(2)}`} accent={analytics.totalPnl >= 0 ? "green" : "red"} />
          <StatCard label="Avg PnL" value={`$${analytics.avgPnl.toFixed(4)}`} accent={analytics.avgPnl >= 0 ? "green" : "red"} />
          <StatCard label="Best Trade" value={`$${analytics.bestTrade.toFixed(4)}`} accent="green" />
          <StatCard label="Max DD" value={`$${analytics.maxDrawdown.toFixed(2)}`} accent="red" />
        </div>
      )}

      {/* PnL Curve */}
      {analytics && analytics.pnlCurve.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-8"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Cumulative PnL
          </h2>
          <PnlChart data={analytics.pnlCurve} />
        </div>
      )}

      {/* Per-asset breakdown */}
      {analytics && Object.keys(analytics.byAsset).length > 0 && (
        <div
          className="rounded-xl border p-4 mb-8"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Performance by Asset
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(analytics.byAsset).map(([asset, data]) => (
              <div
                key={asset}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
              >
                <div className="text-xs font-bold font-mono" style={{ color: "var(--accent-blue)" }}>
                  {asset}
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Trades</span>
                  <span style={{ color: "var(--text-primary)" }}>{data.trades}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Win Rate</span>
                  <span style={{ color: data.winRate >= 0.5 ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {(data.winRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>PnL</span>
                  <span
                    className="font-mono"
                    style={{ color: data.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}
                  >
                    ${data.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade history table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Trade History
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Loading trades...
          </div>
        ) : trades.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No trades yet. Start the bot to begin trading.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Time", "Market", "Side", "Entry", "Exit", "Qty", "PnL", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 font-medium uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {trades
                  .slice()
                  .reverse()
                  .slice(0, 50)
                  .map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[var(--bg-card-hover)]"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {new Date(t.timestamp).toLocaleString("en-GB", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-primary)" }}>
                        {t.asset}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{
                            background: t.outcome === "UP" ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                            color: t.outcome === "UP" ? "var(--accent-green)" : "var(--accent-red)",
                          }}
                        >
                          {t.outcome}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-primary)" }}>
                        {t.entryPrice.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-primary)" }}>
                        {t.exitPrice?.toFixed(4) ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-primary)" }}>
                        {t.contracts}
                      </td>
                      <td
                        className="px-3 py-2 font-mono font-medium"
                        style={{
                          color:
                            t.pnl === null
                              ? "var(--text-muted)"
                              : t.pnl >= 0
                                ? "var(--accent-green)"
                                : "var(--accent-red)",
                        }}
                      >
                        {t.pnl !== null ? `${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-[10px] font-medium uppercase"
                          style={{
                            color:
                              t.status === "won"
                                ? "var(--accent-green)"
                                : t.status === "lost"
                                  ? "var(--accent-red)"
                                  : t.status === "open"
                                    ? "var(--accent-blue)"
                                    : "var(--accent-yellow)",
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Inline components ──

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "red";
}) {
  const colorVar =
    accent === "green"
      ? "var(--accent-green)"
      : accent === "red"
        ? "var(--accent-red)"
        : "var(--text-primary)";

  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-base font-bold font-mono" style={{ color: colorVar }}>
        {value}
      </div>
    </div>
  );
}

function PnlChart({ data }: { data: Array<{ timestamp: string; cumPnl: number }> }) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.cumPnl);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const width = 800;
  const height = 120;
  const padY = 8;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padY - ((d.cumPnl - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const zeroY = height - padY - ((0 - min) / range) * (height - padY * 2);
  const finalPnl = data[data.length - 1].cumPnl;
  const lineColor = finalPnl >= 0 ? "var(--accent-green)" : "var(--accent-red)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "120px" }}>
      {/* Zero line */}
      <line
        x1="0" y1={zeroY} x2={width} y2={zeroY}
        stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4"
      />
      {/* PnL line */}
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Labels */}
      <text x="4" y="12" fontSize="10" fill="var(--text-muted)" fontFamily="var(--font-mono)">
        ${max.toFixed(2)}
      </text>
      <text x="4" y={height - 2} fontSize="10" fill="var(--text-muted)" fontFamily="var(--font-mono)">
        ${min.toFixed(2)}
      </text>
    </svg>
  );
}
