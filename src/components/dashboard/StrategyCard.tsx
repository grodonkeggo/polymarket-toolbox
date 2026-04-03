import type { Strategy } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";

export default function StrategyCard({ strategy }: { strategy: Strategy }) {
  const m = strategy.metrics;

  return (
    <div
      className="rounded-xl border p-4 transition-colors hover:border-[var(--border-accent)]"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {strategy.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {strategy.runtime} &middot; {strategy.asset}
          </p>
        </div>
        <StatusBadge status={strategy.status} />
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {strategy.description}
      </p>

      {m && (
        <div
          className="grid grid-cols-3 gap-2 pt-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <Stat label="Win Rate" value={`${(m.winRate * 100).toFixed(1)}%`} positive={m.winRate > 0.5} />
          <Stat label="Trades" value={m.totalTrades.toLocaleString()} />
          <Stat label="PnL" value={`$${m.pnl.toFixed(2)}`} positive={m.pnl >= 0} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {strategy.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="text-sm font-semibold font-mono"
        style={{
          color:
            positive === undefined
              ? "var(--text-primary)"
              : positive
                ? "var(--accent-green)"
                : "var(--accent-red)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
