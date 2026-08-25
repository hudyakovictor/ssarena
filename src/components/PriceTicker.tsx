import { ACTIVE_PROFILE } from "../lib/marketProfile";

export function PriceTicker() {
  const row = [...ACTIVE_PROFILE.tickers, ...ACTIVE_PROFILE.tickers];
  return (
    <div className="relative w-full overflow-hidden border-y border-[var(--edge)] bg-[var(--abyss)]/70 py-1.5">
      <div className="flex w-max animate-[ticker_30s_linear_infinite] gap-7 px-4">
        {row.map((it, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px]">
            <span className="font-bold text-[var(--inkSoft)]">{it.sym}</span>
            <span className="text-[var(--ink)]">{it.price}</span>
            <span style={{ color: it.chg >= 0 ? "var(--long)" : "var(--short)" }}>
              {it.chg >= 0 ? "▲" : "▼"} {Math.abs(it.chg)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
