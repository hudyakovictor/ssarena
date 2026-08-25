import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { api } from "../lib/api";
import { C } from "../lib/data";
import { useT } from "../i18n";

interface Row {
  rank: number;
  id: string;
  display_name: string;
  rating: number;
  winRate: number;
  streak: number;
  total_battles: number;
}

// Block 1.5 — global leaderboard from the server (rating DESC).
export function LeaderboardPanel({ myPlayerId = "" }: { myPlayerId?: string }) {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: any[] = await api.getLeaderboard(20);
        if (cancelled) return;
        if (Array.isArray(data) && data.length) {
          setRows(data.map((r) => ({
            rank: r.rank, id: r.id, display_name: r.display_name,
            rating: r.rating ?? 1000, winRate: r.winRate ?? 0,
            streak: r.streak ?? 0, total_battles: r.total_battles ?? 0,
          })));
          const i = data.findIndex((r) => r.id === myPlayerId);
          if (i >= 0) setMyRank((data[i] as any).rank ?? i + 1);
          setOffline(false);
        } else {
          setOffline(true);
        }
      } catch { setOffline(true); }
    })();
    return () => { cancelled = true; };
  }, [myPlayerId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="panel p-5 border-2" style={{ borderColor: `${C.gold}33` }}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} className="text-[var(--gold)]" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--gold)]">{t("dashboard.leaderboard")}</span>
        {myRank && <span className="ml-auto font-mono text-[10px] text-[var(--gold)]">#{myRank}</span>}
      </div>
      {offline ? (
        <div className="py-6 text-center">
          <Users size={24} className="mx-auto text-[var(--inkDim)] mb-2" />
          <p className="font-mono text-[11px] text-[var(--inkSoft)]">Лидерборд появится, когда поднимется сервер.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {rows.map((r) => (
            <div key={r.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${myPlayerId === r.id ? "bg-[var(--gold)]/10 border border-[var(--gold)]/30" : "bg-white/[0.02]"}`}>
              <span className="font-mono text-[11px] w-6 text-center font-bold" style={{ color: r.rank <= 3 ? C.gold : "var(--inkDim)" }}>
                {r.rank}
              </span>
              <span className="text-sm font-mono flex-1 truncate">
                {r.rank === 1 ? "👑 " : ""}{r.display_name}{myPlayerId === r.id ? " (ты)" : ""}
              </span>
              <span className="font-mono text-[11px] text-[var(--signal)]">{r.rating}</span>
              <span className="font-mono text-[9px] text-[var(--inkDim)] w-9 text-right">{r.winRate}%</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
