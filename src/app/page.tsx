import { visibleStrategies as strategies, visibleBots as bots } from "@/lib/registry";
import StrategyCard from "@/components/dashboard/StrategyCard";
import BotCard from "@/components/dashboard/BotCard";

export default function DashboardPage() {
  const activeStrategies = strategies.filter((s) => s.status === "active");
  const totalTrades = strategies.reduce((sum, s) => sum + (s.metrics?.totalTrades ?? 0), 0);
  const totalPnl = strategies.reduce((sum, s) => sum + (s.metrics?.pnl ?? 0), 0);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Overview of your Polymarket strategies and bots
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Strategies" value={String(strategies.length)} />
        <StatCard label="Active" value={String(activeStrategies.length)} accent="green" />
        <StatCard label="Total Trades" value={totalTrades.toLocaleString()} />
        <StatCard
          label="Total PnL"
          value={`$${totalPnl.toFixed(2)}`}
          accent={totalPnl >= 0 ? "green" : "red"}
        />
      </div>

      {/* Active strategies */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Active Strategies
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
          Bots
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
