"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [canLaunch, setCanLaunch] = useState(false);
  const [processInfo, setProcessInfo] = useState<{ pid: number | null; startedAt: string | null } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [modeLoading, setModeLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
    if (data.canLaunch !== undefined) setCanLaunch(data.canLaunch);
    if (data.dryRun !== undefined) setDryRun(data.dryRun);
    if (data.process) setProcessInfo(data.process);
  }, [botId]);

  const fetchLogs = useCallback(async () => {
    if (!botId || !showLogs) return;
    const res = await fetch(`/api/bots/${botId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logs", tail: 200 }),
    });
    const data = await res.json();
    if (data.logs) setLogs(data.logs);
  }, [botId, showLogs]);

  useEffect(() => {
    fetchTrades();
    fetchStatus();
  }, [fetchTrades, fetchStatus]);

  // Poll status + logs while running
  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      fetchStatus();
      if (showLogs) fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [status, showLogs, fetchStatus, fetchLogs]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const toggleMode = async () => {
    setModeLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setMode", dryRun: !dryRun }),
      });
      const data = await res.json();
      if (data.dryRun !== undefined) setDryRun(data.dryRun);
      if (data.message) setActionMessage(data.message);
    } finally {
      setModeLoading(false);
    }
  };

  const sendAction = async (action: "start" | "stop" | "pause") => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/bots/${botId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.message) setActionMessage(data.message);
      if (action === "start" && data.ok) setShowLogs(true);
      // Refresh status after action
      setTimeout(fetchStatus, 500);
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
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {status !== "running" && (
              <button
                onClick={() => sendAction("start")}
                disabled={actionLoading || !canLaunch}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}
                title={!canLaunch ? "Only available when running locally" : ""}
              >
                {actionLoading ? "..." : "Start"}
              </button>
            )}
            {status === "running" && (
              <>
                <button
                  onClick={() => sendAction("pause")}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: "var(--accent-yellow-dim)", color: "var(--accent-yellow)" }}
                >
                  {actionLoading ? "..." : "Pause"}
                </button>
                <button
                  onClick={() => setShowLogs((v) => !v)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--accent-purple-dim)", color: "var(--accent-purple)" }}
                >
                  {showLogs ? "Hide Logs" : "Logs"}
                </button>
              </>
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
          {!canLaunch && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Launch available on localhost only
            </span>
          )}
          {processInfo?.pid && (
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              PID {processInfo.pid} &middot; since {new Date(processInfo.startedAt ?? "").toLocaleTimeString()}
            </span>
          )}
          {actionMessage && (
            <span className="text-[10px]" style={{ color: "var(--accent-blue)" }}>
              {actionMessage}
            </span>
          )}
        </div>
      </div>

      {/* Trading Mode */}
      <div
        className="rounded-xl border p-4 mb-8"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Trading Mode
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {dryRun
                ? "Paper trading — connects to real feeds, logs signals, no real orders"
                : "Live trading — real orders, real USDC spent"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: dryRun ? "var(--text-muted)" : "var(--accent-red)" }}
            >
              {dryRun ? "Dry Run" : "Live"}
            </span>

            {/* Toggle switch */}
            <button
              onClick={toggleMode}
              disabled={modeLoading || status === "running"}
              title={status === "running" ? "Stop the bot before switching mode" : ""}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50"
              style={{
                background: dryRun ? "var(--accent-blue)" : "var(--accent-red)",
              }}
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                style={{
                  transform: dryRun ? "translateX(4px)" : "translateX(32px)",
                }}
              />
            </button>
          </div>
        </div>

        {!dryRun && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-xs flex items-center gap-2"
            style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}
          >
            <span className="font-bold">WARNING:</span> Bot will place real orders and spend real USDC when started.
          </div>
        )}

        {status === "running" && (
          <div
            className="mt-2 text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            Stop the bot to change trading mode. Current session: {dryRun ? "dry run" : "live"}.
          </div>
        )}
      </div>

      {/* Live Logs */}
      {showLogs && (
        <div
          className="rounded-xl border mb-8 overflow-hidden"
          style={{ background: "#0d1117", borderColor: "var(--border)" }}
        >
          <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Live Output
            </h2>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {logs.length} lines &middot; auto-refresh 3s
            </span>
          </div>
          <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed" style={{ color: "var(--accent-green)" }}>
            {logs.length === 0 ? (
              <span style={{ color: "var(--text-muted)" }}>Waiting for output...</span>
            ) : (
              logs.map((line, i) => (
                <div key={i} style={{ color: line.includes("[stderr]") ? "var(--accent-yellow)" : line.includes("[system]") ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {line}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Resolved" value={String(analytics.totalTrades)} />
          <StatCard label="Open" value={String(analytics.open)} accent={analytics.open > 0 ? "blue" : undefined} />
          <StatCard label="Win Rate" value={analytics.totalTrades > 0 ? `${(analytics.winRate * 100).toFixed(1)}%` : "—"} accent={analytics.totalTrades > 0 ? (analytics.winRate >= 0.5 ? "green" : "red") : undefined} />
          <StatCard label="Total PnL" value={analytics.totalTrades > 0 ? `$${analytics.totalPnl.toFixed(2)}` : "—"} accent={analytics.totalTrades > 0 ? (analytics.totalPnl >= 0 ? "green" : "red") : undefined} />
          <StatCard label="Best Trade" value={analytics.totalTrades > 0 ? `$${analytics.bestTrade.toFixed(4)}` : "—"} accent={analytics.totalTrades > 0 ? "green" : undefined} />
          <StatCard label="Max DD" value={analytics.totalTrades > 0 ? `$${analytics.maxDrawdown.toFixed(2)}` : "—"} accent={analytics.totalTrades > 0 ? "red" : undefined} />
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
  accent?: "green" | "red" | "blue";
}) {
  const colorVar =
    accent === "green"
      ? "var(--accent-green)"
      : accent === "red"
        ? "var(--accent-red)"
        : accent === "blue"
          ? "var(--accent-blue)"
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
