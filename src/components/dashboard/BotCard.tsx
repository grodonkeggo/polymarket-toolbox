import type { Bot } from "@/lib/types";
import { getStrategy } from "@/lib/registry";
import StatusBadge from "@/components/ui/StatusBadge";

export default function BotCard({ bot }: { bot: Bot }) {
  const strategy = getStrategy(bot.strategyId);

  return (
    <div
      className="rounded-xl border p-4 transition-colors hover:border-[var(--border-accent)]"
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
        <StatusBadge status={bot.status} />
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
    </div>
  );
}
