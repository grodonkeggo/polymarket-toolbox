import { visibleBots as bots } from "@/lib/registry";
import BotCard from "@/components/dashboard/BotCard";

export default function BotsPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Bots
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {bots.length} configured bots &middot; manage and monitor your live trading agents
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map((b) => (
          <BotCard key={b.id} bot={b} />
        ))}
      </div>

      <div
        className="mt-8 rounded-xl border-2 border-dashed p-8 text-center"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <p className="text-sm">Drop a bot config or add one from your strategies to get started</p>
      </div>
    </>
  );
}
