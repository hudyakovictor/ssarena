// ============================================================
// SIGNAL ARENA — ARENA SCREEN
// Tournaments, matchmaking, leaderboards, PvP
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Users, Clock, Swords, Crown, Shield, Star, Flame,
  ChevronRight, Award, TrendingUp, Zap, Globe, RefreshCw
} from 'lucide-react';
import type { Screen } from '../App';
import { useT } from '../i18n';
import { getState, getRating, TOURNAMENTS, C } from '../lib/gameState';
import { api } from '../lib/api';
import { TournamentBracket } from '../components/TournamentBracket';

interface ArenaProps {
  player: any;
  setScreen: (s: Screen) => void;
}

// ── MOCK LEADERBOARD ──
const LEADERBOARD = [
  { rank: 1, name: 'CryptoSensei', rating: 2847, wins: 342, streak: 18, glyph: '👑' },
  { rank: 2, name: 'DiamondHands69', rating: 2756, wins: 298, streak: 12, glyph: '💎' },
  { rank: 3, name: 'OnChainWitch', rating: 2698, wins: 267, streak: 9, glyph: '🔮' },
  { rank: 4, name: 'FOMOImmune', rating: 2634, wins: 245, streak: 7, glyph: '🛡️' },
  { rank: 5, name: 'WhaleTracker', rating: 2589, wins: 231, streak: 5, glyph: '🐋' },
  { rank: 6, name: 'StopLossDisciple', rating: 2534, wins: 218, streak: 4, glyph: '🛑' },
  { rank: 7, name: 'NarrativeReader', rating: 2478, wins: 201, streak: 6, glyph: '📖' },
  { rank: 8, name: 'RiskManager99', rating: 2423, wins: 189, streak: 3, glyph: '⚖️' },
  { rank: 9, name: 'SignalHunter', rating: 2367, wins: 176, streak: 2, glyph: '🎯' },
  { rank: 10, name: 'ProofOfSkill', rating: 2312, wins: 164, streak: 4, glyph: '⚔️' },
];

// ── LIVE STATS ──
function useOnlineStats() {
  const [stats, setStats] = useState({ online: 0, inBattle: 0, queueTime: 0 });
  
  useEffect(() => {
    // Simulate live stats
    const base = 847;
    const update = () => {
      const online = base + Math.floor(Math.random() * 200) - 100;
      setStats({
        online,
        inBattle: Math.floor(online * 0.3),
        queueTime: Math.floor(Math.random() * 15) + 3,
      });
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}

export function Arena({ setScreen }: ArenaProps) {
  const { t } = useT();
  const [state, setState] = useState(getState());
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leaderboard' | 'queue'>('tournaments');
  const [weekly, setWeekly] = useState<any | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const rating = getRating();
  const onlineStats = useOnlineStats();

  const loadWeekly = useCallback(async () => {
    try {
      const d = await api.getTournamentWeekly();
      if (d && Array.isArray(d.matches)) { setWeekly(d); setWeeklyError(null); }
      else setWeeklyError("empty bracket");
    } catch (e: any) { setWeeklyError(e?.message || "unreachable"); }
  }, []);

  useEffect(() => { loadWeekly(); }, [loadWeekly]);
  
  useEffect(() => {
    const interval = setInterval(() => setState(getState()), 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider">
            {t('arena.title')}
          </h1>
          <p className="font-mono text-xs text-[var(--inkDim)] mt-1">
            {t('arena.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-1.5">
            <Trophy size={14} className="text-[var(--gold)]" />
            <span className="font-mono text-xs font-bold">{rating}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-1.5">
            <Users size={14} className="text-[var(--long)]" />
            <span className="font-mono text-xs font-bold">{onlineStats.online}</span>
          </div>
        </div>
      </motion.div>

      {/* ── LIVE STATS BAR ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: t('arena.players_online'), value: onlineStats.online, icon: <Users size={16} />, color: C.long },
          { label: 'In Battle', value: onlineStats.inBattle, icon: <Swords size={16} />, color: C.signal },
          { label: t('arena.queue_time'), value: `~${onlineStats.queueTime}s`, icon: <Clock size={16} />, color: C.gold },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="panel p-3 text-center">
            <div className="flex items-center justify-center mb-1" style={{ color }}>{icon}</div>
            <p className="font-display text-lg font-bold" style={{ color }}>{value}</p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── TABS ── */}
      <div className="flex gap-2">
        {[
          { id: 'tournaments' as const, label: t('tournament.title'), icon: <Trophy size={14} /> },
          { id: 'leaderboard' as const, label: t('dashboard.leaderboard'), icon: <Crown size={14} /> },
          { id: 'queue' as const, label: 'Quick Match', icon: <Swords size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
              activeTab === tab.id 
                ? 'bg-[var(--signal)]/10 border border-[var(--signal)]/40 text-[var(--signal)]' 
                : 'border border-[var(--edge)] text-[var(--inkDim)] hover:bg-white/[0.02]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'tournaments' && (
          <motion.div
            key="tournaments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* ── WEEKLY CUP — LIVE BRACKET (block 3.4, from top-16 leaderboard) ── */}
            {weekly ? (
              <div className="panel p-4">
                <TournamentBracket tournament={weekly} />
                <button onClick={loadWeekly} className="btn-ghost mt-3 px-3 py-1.5 text-[10px]">
                  <RefreshCw size={11} /> {weekly.note || "Refresh"}
                </button>
              </div>
            ) : (
              <div className="panel p-3">
                <p className="font-mono text-[10px] text-[var(--inkDim)] text-center">
                  {weeklyError ? `Live bracket offline (${weeklyError}) — mock below` : "Loading live bracket…"}
                </p>
              </div>
            )}
            {TOURNAMENTS.map((tournament, i) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="panel p-5 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${tournament.color})` }}>
                      {tournament.glyph}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-black" style={{ color: tournament.color }}>
                        {tournament.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="pill" style={{ background: `${tournament.color}1a`, color: tournament.color, border: `1px solid ${tournament.color}44` }}>
                          {tournament.tag}
                        </span>
                        <span className="pill" style={{ background: `${C.signal}1a`, color: C.signal, border: `1px solid ${C.signal}44` }}>
                          {tournament.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-[var(--inkDim)]" />
                          <span className="font-mono text-[10px] text-[var(--inkSoft)]">
                            {tournament.players.toLocaleString()} {t('tournament.players')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy size={12} className="text-[var(--gold)]" />
                          <span className="font-mono text-[10px] text-[var(--gold)]">
                            {tournament.prize}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[var(--short)]" />
                          <span className="font-mono text-[10px] text-[var(--short)]">
                            {tournament.timeLeft}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setScreen('battle')}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {t('tournament.register')}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="panel overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--edge)]">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">#</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Player</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">{t('common.rating')}</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">{t('common.wins')}</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">{t('common.streak')}</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD.map((player, i) => (
                    <motion.tr
                      key={player.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-b border-[var(--edge)]/50 hover:bg-white/[0.02] transition-colors ${
                        i < 3 ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-display text-sm font-bold ${
                          i === 0 ? 'text-[var(--gold)]' : i === 1 ? 'text-[var(--inkSoft)]' : i === 2 ? 'text-amber-600' : 'text-[var(--inkDim)]'
                        }`}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : player.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{player.glyph}</span>
                          <span className="font-heading text-sm font-bold">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold" style={{ color: C.gold }}>
                        {player.rating}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--inkSoft)]">
                        {player.wins}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm" style={{ color: player.streak > 10 ? C.short : player.streak > 5 ? C.gold : C.long }}>
                          {player.streak}🔥
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Your position */}
            <div className="border-t-2 border-[var(--signal)]/40 bg-[var(--signal)]/5 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[var(--inkDim)]">#{LEADERBOARD.length + 1}</span>
                <span className="text-lg">🎯</span>
                <span className="font-heading text-sm font-bold text-[var(--signal)]">You</span>
              </div>
              <span className="font-mono text-sm font-bold text-[var(--gold)]">{rating}</span>
            </div>
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { mode: 'training', name: t('battle.training'), desc: 'No rating loss', icon: '🎯', color: C.long, players: '∞' },
                { mode: 'ghost', name: t('battle.ghost_duel'), desc: 'vs Player Recording', icon: '👻', color: C.pink, players: onlineStats.online },
                { mode: 'live', name: t('battle.live_duel'), desc: 'Real-time PvP', icon: '⚔️', color: C.short, players: onlineStats.inBattle },
                { mode: 'daily', name: t('battle.daily_puzzle'), desc: 'Daily challenge', icon: '🧩', color: C.signal, players: 'All' },
              ].map(({ mode, name, desc, icon, color, players }) => (
                <button
                  key={mode}
                  onClick={() => setScreen('battle')}
                  className="panel p-5 text-center hover:scale-[1.02] transition-transform"
                >
                  <span className="text-3xl">{icon}</span>
                  <p className="mt-2 font-heading text-sm font-bold">{name}</p>
                  <p className="text-xs text-[var(--inkSoft)]">{desc}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Users size={10} className="text-[var(--inkDim)]" />
                    <span className="font-mono text-[10px] text-[var(--inkDim)]">{players}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="panel p-4 text-center">
              <p className="font-mono text-[10px] text-[var(--inkDim)]">
                Average queue time: ~{onlineStats.queueTime}s · {onlineStats.online} players online
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
