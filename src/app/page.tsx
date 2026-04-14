"use client";

import { useState, useEffect, useCallback } from "react";
import { visibleStrategies as strategies, visibleBots as bots } from "@/lib/registry";
import StrategyCard from "@/components/dashboard/StrategyCard";
import BotCard from "@/components/dashboard/BotCard";

interface BotSummary {
  botId: string;
  name: string;
  totalTrades: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number;
  totalPnl: number;
}

interface Summary {
  date: string;
  aggregate: {
    totalTrades: number;
    wins: number;
    losses: number;
    open: number;
    winRate: number;
    totalPnl: number;
  };
  bots: BotSummary[];
}

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState(today);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [allTimeSummary, setAllTimeSummary] = useState<Summary | null>(null);

  const fetchSummary = useCallback(async () => {
    const [dayRes, allRes] = await Promise.all([
      fetch(`/api/summary?date=${dateFilter}`),
      fetch(`/api/summary?date=all`),
    ]);
    const dayData = await dayRes.json();
    const allData = await allRes.json();
    setSummary(dayData);
    setAllTimeSummary(allData);
  }, [dateFilter]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const agg = summary?.aggregate;
  const allAgg = allTimeSummary?.aggregate;
  const activeStrategies = strategies.filter((s) => s.status === "active");

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Polymarket strategies and bots — live overview
        </p>
      </header>

      {/* Date picker */}
      <div className="flex items-center gap-2 mb-6">
        {["today", "yesterday", "all"].map((label) => {
          const val =
            label === "today"
              ? today
              : label === "yesterday"
                ? new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                : "all";
          const active = dateFilter === val;
          return (
            <button
              key={label}
              onClick={() => setDateFilter(val)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors"
              style={{
                background: active ? "var(--accent-blue-dim)" : "var(--bg-card)",
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                borderWidth: 1,
                borderColor: active ? "var(--accent-blue)" : "var(--border)",
              }}
            >
              {label}
            </button>
          );
        })}
        <input
          type="date"
          value={dateFilter === "all" ? "" : dateFilter}
          onChange={(e) => setDateFilter(e.target.value || "all")}
          className="px-2 py-1 rounded-lg text-xs font-mono"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", borderWidth: 1, borderColor: "var(--border)" }}
        />
      </div>

      {/* Period stats */}
      {agg && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard
            label={dateFilter === "all" ? "All Trades" : "Trades Today"}
            value={String(agg.totalTrades)}
          />
          <StatCard label="Wins" value={String(agg.wins)} accent="green" />
          <StatCard label="Losses" value={String(agg.losses)} accent="red" />
          <StatCard label="Open" value={String(agg.open)} accent={agg.open > 0 ? "blue" : undefined} />
          <StatCard
            label="Win Rate"
            value={agg.totalTrades > 0 ? `${(agg.winRate * 100).toFixed(1)}%` : "—"}
            accent={agg.totalTrades > 0 ? (agg.winRate >= 0.5 ? "green" : "red") : undefined}
          />
          <StatCard
            label={dateFilter === "all" ? "Total PnL" : "PnL Today"}
            value={agg.totalTrades > 0 ? `$${agg.totalPnl.toFixed(2)}` : "—"}
            accent={agg.totalTrades > 0 ? (agg.totalPnl >= 0 ? "green" : "red") : undefined}
          />
        </div>
      )}

      {/* Per-bot breakdown */}
      {summary?.bots && summary.bots.some((b) => b.totalTrades > 0 || b.open > 0) && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            {dateFilter === "all" ? "All Time" : dateFilter === today ? "Today" : dateFilter} — Per Bot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.bots.filter((b) => b.totalTrades > 0 || b.open > 0).map((b) => (
              <div
                key={b.botId}
                className="rounded-xl border p-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {b.name}
                  </span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: b.totalPnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}
                  >
                    {b.totalPnl >= 0 ? "+" : ""}{b.totalPnl.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <div style={{ color: "var(--text-muted)" }}>Trades</div>
                    <div className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{b.totalTrades}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)" }}>Wins</div>
                    <div className="font-mono font-medium" style={{ color: "var(--accent-green)" }}>{b.wins}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)" }}>Losses</div>
                    <div className="font-mono font-medium" style={{ color: "var(--accent-red)" }}>{b.losses}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)" }}>WR</div>
                    <div className="font-mono font-medium" style={{ color: b.winRate >= 0.5 ? "var(--accent-green)" : "var(--accent-red)" }}>
                      {b.totalTrades > 0 ? `${(b.winRate * 100).toFixed(0)}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All-time summary (when viewing daily) */}
      {dateFilter !== "all" && allAgg && allAgg.totalTrades > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            All Time
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Total Trades" value={String(allAgg.totalTrades)} />
            <MiniStat label="Win Rate" value={`${(allAgg.winRate * 100).toFixed(1)}%`} accent={allAgg.winRate >= 0.5 ? "green" : "red"} />
            <MiniStat label="Total PnL" value={`$${allAgg.totalPnl.toFixed(2)}`} accent={allAgg.totalPnl >= 0 ? "green" : "red"} />
            <MiniStat label="Open" value={String(allAgg.open)} />
          </div>
        </section>
      )}

      {/* Active strategies */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Strategies ({strategies.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStrategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      </section>

      {/* Bots */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Bots ({bots.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((b) => (
            <BotCard key={b.id} bot={b} />
          ))}
        </div>
      </section>
    </>
  );
}

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
      className="rounded-xl border px-4 py-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-xl font-bold font-mono" style={{ color: colorVar }}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({
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
      className="rounded-lg border px-3 py-2"
      style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-sm font-bold font-mono" style={{ color: colorVar }}>
        {value}
      </div>
    </div>
  );
}
