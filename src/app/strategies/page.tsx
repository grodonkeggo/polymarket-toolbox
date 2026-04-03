import { strategies } from "@/lib/registry";
import StrategyCard from "@/components/dashboard/StrategyCard";

export default function StrategiesPage() {
  const grouped = {
    active: strategies.filter((s) => s.status === "active"),
    paused: strategies.filter((s) => s.status === "paused"),
    draft: strategies.filter((s) => s.status === "draft"),
    backtest: strategies.filter((s) => s.status === "backtest"),
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Strategies
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          All {strategies.length} strategies across your projects
        </p>
      </header>

      {Object.entries(grouped).map(
        ([status, items]) =>
          items.length > 0 && (
            <section key={status} className="mb-8">
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                {status} ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s) => (
                  <StrategyCard key={s.id} strategy={s} />
                ))}
              </div>
            </section>
          ),
      )}
    </>
  );
}
