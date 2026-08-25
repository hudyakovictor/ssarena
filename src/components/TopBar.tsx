import { motion } from "framer-motion";
import { RANKS, C } from "../lib/data";
import { WalletConnect } from "./WalletConnect";
import { ReferralSystem } from "./ReferralSystem";

export function TopBar({ player, onRejoin, rejoinStatus }: { player: any; onRejoin?: (code: string) => void; rejoinStatus?: string | null }) {
  const rank = RANKS[player.rankIndex];
  const nextRank = RANKS[player.rankIndex + 1];
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--edge)] bg-[var(--void)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--signal)] to-[var(--grape)] lg:hidden">
          <span className="font-display text-sm font-black text-[var(--void)]">S</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: rank.color }}>{rank.tier}</span>
            <span className="font-heading text-xs sm:text-sm font-bold truncate">{rank.nameRu}</span>
            <span className="font-mono text-[9px] text-[var(--inkSoft)] hidden sm:inline">XP {player.xp}{nextRank ? ` / ${nextRank.minXp}` : ""}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--signal)] to-[var(--grape)]"
              initial={{ width: 0 }} animate={{ width: `${nextRank ? Math.min(100, (player.xp / nextRank.minXp) * 100) : 100}%` }}
              transition={{ duration: 0.8 }} />
          </div>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--edge)] bg-white/[0.02] px-2 py-1">
            <span className="text-[10px]">⚡</span>
            <span className="font-mono text-[10px] font-medium text-[var(--signal)]">{player.attention}/{player.maxAttention}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--edge)] bg-white/[0.02] px-2 py-1">
            <span className="text-[10px]">🛡️</span>
            <span className="font-mono text-[10px] font-medium text-[var(--long)]">{player.disciplineShield}%</span>
          </div>
        </div>
        <div className="relative hidden sm:block">
          <ReferralSystem playerId={player.id} onRejoin={onRejoin} rejoinStatus={rejoinStatus} />
        </div>
        <WalletConnect playerId={player.id} displayName={player.name} />
      </div>
    </header>
  );
}
