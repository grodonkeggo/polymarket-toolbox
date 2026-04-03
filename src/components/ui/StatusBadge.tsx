type Status = "active" | "paused" | "backtest" | "draft" | "running" | "stopped" | "error" | "idle";

const statusStyles: Record<Status, { bg: string; color: string; dot: string }> = {
  active:   { bg: "var(--accent-green-dim)", color: "var(--accent-green)", dot: "var(--accent-green)" },
  running:  { bg: "var(--accent-green-dim)", color: "var(--accent-green)", dot: "var(--accent-green)" },
  paused:   { bg: "var(--accent-yellow-dim)", color: "var(--accent-yellow)", dot: "var(--accent-yellow)" },
  idle:     { bg: "var(--accent-yellow-dim)", color: "var(--accent-yellow)", dot: "var(--accent-yellow)" },
  backtest: { bg: "var(--accent-blue-dim)", color: "var(--accent-blue)", dot: "var(--accent-blue)" },
  draft:    { bg: "rgba(138,150,168,0.1)", color: "var(--text-secondary)", dot: "var(--text-muted)" },
  stopped:  { bg: "rgba(138,150,168,0.1)", color: "var(--text-secondary)", dot: "var(--text-muted)" },
  error:    { bg: "var(--accent-red-dim)", color: "var(--accent-red)", dot: "var(--accent-red)" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status] ?? statusStyles.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}
