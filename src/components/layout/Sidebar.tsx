"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/strategies", label: "Strategies", icon: "layers" },
  { href: "/bots", label: "Bots", icon: "bot" },
  { href: "/backtest", label: "Backtest", icon: "chart" },
];

const icons: Record<string, React.ReactNode> = {
  grid: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </svg>
  ),
  layers: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  bot: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h0M16 16h0" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 3v18h18M7 16l4-4 4 4 5-6" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 flex flex-col border-r"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}
        >
          P
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Poly Toolbox
          </div>
          <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            v0.1.0
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "var(--accent-blue-dim)" : "transparent",
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
              }}
            >
              {icons[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          7 strategies &middot; 3 bots
        </div>
      </div>
    </aside>
  );
}
