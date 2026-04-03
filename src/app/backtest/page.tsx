import { strategies } from "@/lib/registry";

export default function BacktestPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Backtest
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Test and finetune strategies against historical data
        </p>
      </header>

      {/* Strategy selector */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Select Strategy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {strategies.map((s) => (
            <button
              key={s.id}
              className="text-left rounded-lg border px-3 py-2 text-xs transition-colors hover:border-[var(--accent-blue)]"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                {s.name}
              </div>
              <div className="mt-0.5">{s.runtime} &middot; {s.asset}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Parameters" description="Configure strategy parameters, filters, and risk controls" />
        <Panel title="Date Range" description="Select historical period for backtesting" />
        <Panel title="Results" description="Win rate, PnL curve, drawdown, trade-by-trade analysis" />
        <Panel title="Optimization" description="Parameter sweeps and sensitivity analysis" />
      </div>
    </>
  );
}

function Panel({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="rounded-xl border-2 border-dashed p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <div
        className="mt-4 text-[10px] font-mono uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Coming soon
      </div>
    </div>
  );
}
