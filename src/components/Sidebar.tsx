import {
  LayoutDashboard, BookOpen, Swords, Library, Skull, User, Settings,
  ChevronsLeft, ChevronsRight, Shield,
} from "lucide-react";
import type { Screen } from "../App";
import { RANKS, C } from "../lib/data";

// nav: real Screen keys + theme colors
const NAV: { id: Screen; label: string; Icon: any; color: string }[] = [
  { id: "home", label: "Дашборд", Icon: LayoutDashboard, color: C.signal },
  { id: "academy", label: "Академия", Icon: BookOpen, color: C.long },
  { id: "arena", label: "Арена", Icon: Swords, color: C.short },
  { id: "collection", label: "Коллекция", Icon: Library, color: C.gold },
  { id: "bestiary", label: "Бестиарий", Icon: Skull, color: C.grape },
  { id: "profile", label: "Профиль", Icon: User, color: C.blue },
  { id: "settings", label: "Настройки", Icon: Settings, color: C.signal },
];

export function Sidebar({
  screen, setScreen, player, isAdmin, collapsed, onToggle,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  player: any;
  isAdmin?: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const rank = RANKS[player.rankIndex] ?? RANKS[0];
  const nextRank = RANKS[player.rankIndex + 1];
  const pct = nextRank ? Math.min(100, (player.xp / nextRank.minXp) * 100) : 100;

  return (
    <aside className={`sticky top-0 z-50 hidden h-full shrink-0 flex-col overflow-hidden border-r border-[var(--edge)] bg-[var(--abyss)] transition-[width] duration-300 ease-out lg:flex ${collapsed ? "w-16" : "w-64"}`}>
      {/* Brand */}
      <div className={collapsed ? "flex flex-col items-center pt-6" : "px-5 pt-6"}>
        <div className={collapsed ? "flex justify-center" : "flex items-center gap-3"}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--signal)] to-[var(--grape)] shadow-lg shadow-[var(--signal)]/20">
            <span className="font-display text-lg font-black text-[var(--void)]">S</span>
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-sm font-bold tracking-wider text-[var(--ink)]">SIGNAL</p>
              <p className="font-display text-[10px] font-bold tracking-[0.2em] text-[var(--signal)]">ARENA</p>
            </div>
          )}
        </div>
        {/* Collapse: LEFT, under logo */}
        <button
          onClick={onToggle}
          title={collapsed ? "Развернуть панель" : "Свернуть панель"}
          className={`mt-3 flex items-center justify-center gap-2 rounded-lg border border-[var(--edge)] bg-white/[0.02] py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] transition-all hover:border-[var(--signal)]/40 hover:bg-[var(--signal)]/10 hover:text-[var(--signal)] ${collapsed ? "w-10 px-0" : "px-3"}`}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={14} />}
          {!collapsed && <span>Свернуть</span>}
        </button>
      </div>

      {/* Rank card */}
      {!collapsed && (
        <div className="mx-4 mt-4 rounded-2xl border border-[var(--edge)] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Текущий ранг</p>
            <span className="rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ color: rank.color, borderColor: `${rank.color}50`, background: `${rank.color}18` }}>
              {rank.tier}
            </span>
          </div>
          <p className="mt-1.5 font-heading text-sm font-bold leading-snug" style={{ color: rank.color }}>{rank.nameRu}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--signal)] to-[var(--grape)]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-[var(--inkSoft)]">{player.xp} / {nextRank?.minXp ?? "∞"} XP</p>
        </div>
      )}

      {/* Nav */}
      <nav className={`mt-3 flex-1 space-y-1 overflow-y-auto pb-3 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && <p className="px-3 pb-1 pt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--inkDim)]">Меню</p>}
        {NAV.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setScreen(id)}
            title={label}
            className={`flex w-full items-center gap-3 rounded-xl py-2.5 transition-all ${collapsed ? "justify-center px-0" : "px-3"} ${screen === id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
          >
            <Icon size={19} color={screen === id ? color : C.inkDim} strokeWidth={screen === id ? 2.5 : 1.5} />
            {!collapsed && (
              <>
                <span className="font-heading text-sm font-semibold" style={{ color: screen === id ? "var(--ink)" : "var(--inkSoft)" }}>{label}</span>
                {screen === id && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
              </>
            )}
          </button>
        ))}
        {isAdmin && (
          <>
            {!collapsed && <div className="my-2 border-t border-[var(--edge)]" />}
            <button
              onClick={() => setScreen("admin")}
              title="Админ-панель"
              className={`flex w-full items-center gap-3 rounded-xl py-2.5 opacity-70 transition-all ${collapsed ? "justify-center px-0" : "px-3"} ${screen === "admin" ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
            >
              <Shield size={18} color={C.gold} />
              {!collapsed && <span className="font-heading text-sm font-semibold text-[var(--inkDim)]">Админ-панель</span>}
            </button>
            <button
              onClick={() => setScreen("overseer")}
              title="AI Overseer"
              className={`flex w-full items-center gap-3 rounded-xl py-2.5 opacity-70 transition-all ${collapsed ? "justify-center px-0" : "px-3"} ${screen === "overseer" ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
            >
              <span className="text-sm leading-none">🦉</span>
              {!collapsed && <span className="font-heading text-sm font-semibold text-[var(--inkDim)]">AI Overseer</span>}
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[var(--edge)] py-4 ${collapsed ? "flex justify-center" : "px-5"}`}>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--long)] shadow-[0_0_6px] shadow-[var(--long)]" />
          {!collapsed && (
            <p className="font-mono text-[9px] leading-4 text-[var(--inkDim)]">Play the market.<br />Don&apos;t become the liquidity.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
