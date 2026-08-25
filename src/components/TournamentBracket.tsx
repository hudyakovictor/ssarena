// ============================================================
// TOURNAMENT BRACKET — Async 24h cup visualization
// Single-elimination bracket with ghost duel results
// ============================================================
import { motion } from "framer-motion";
import { Trophy, Medal, Clock, Users, Swords } from "lucide-react";
import { C } from "../lib/data";

interface BracketMatch {
  id: string; round: number; slot: number;
  player1: { name: string; score: number | null; avatar: string };
  player2: { name: string; score: number | null; avatar: string };
  winner: "p1" | "p2" | null;
  status: "pending" | "live" | "completed";
}

interface Tournament {
  id: string; name: string; tag: string; level: string;
  players: number; maxPlayers: number;
  prizePool: string; timeLeft: string;
  rounds: number; currentRound: number;
  matches: BracketMatch[];
}

const MOCK_TOURNAMENT: Tournament = {
  id: "grandmaster-cup-01", name: "Grandmaster Signal Championship", tag: "Elite", level: "Rank 12-14",
  players: 64, maxPlayers: 64, prizePool: "5,000 $SIG + NFT Crest",
  timeLeft: "1d 14:22:10", rounds: 6, currentRound: 3,
  matches: [
    // Finals (round 6 — placeholder)
    { id: "f1", round: 6, slot: 0, player1: { name: "???", score: null, avatar: "👑" }, player2: { name: "???", score: null, avatar: "👑" }, winner: null, status: "pending" },
    // Semi-finals (round 5)
    { id: "sf1", round: 5, slot: 0, player1: { name: "???", score: null, avatar: "🦅" }, player2: { name: "???", score: null, avatar: "🦅" }, winner: null, status: "pending" },
    { id: "sf2", round: 5, slot: 1, player1: { name: "???", score: null, avatar: "🦅" }, player2: { name: "???", score: null, avatar: "🦅" }, winner: null, status: "pending" },
    // Quarter-finals (round 4)
    { id: "qf1", round: 4, slot: 0, player1: { name: "0xSentinel", score: 892, avatar: "🦅" }, player2: { name: "ColdHandz", score: 874, avatar: "🧊" }, winner: "p1", status: "completed" },
    { id: "qf2", round: 4, slot: 1, player1: { name: "null_set", score: 921, avatar: "🧠" }, player2: { name: "ThetaWarden", score: 798, avatar: "⚡" }, winner: "p1", status: "completed" },
    { id: "qf3", round: 4, slot: 2, player1: { name: "FadeKing", score: 845, avatar: "🎭" }, player2: { name: "BlockSeeker", score: 862, avatar: "🔍" }, winner: "p2", status: "completed" },
    { id: "qf4", round: 4, slot: 3, player1: { name: "SigmaSoul", score: 856, avatar: "Σ" }, player2: { name: "LiquidityLad", score: 839, avatar: "🌊" }, winner: "p1", status: "completed" },
    // Round 3 (in progress)
    { id: "r3m1", round: 3, slot: 0, player1: { name: "PaperToDiamond", score: 901, avatar: "💎" }, player2: { name: "MACD_Mage", score: 743, avatar: "🧙" }, winner: "p1", status: "completed" },
    { id: "r3m2", round: 3, slot: 1, player1: { name: "DeltaDegen", score: null, avatar: "🎲" }, player2: { name: "SatoshiSilence", score: null, avatar: "🤫" }, winner: null, status: "live" },
  ],
};

export function TournamentBracket({ tournament = MOCK_TOURNAMENT }: { tournament?: Tournament }) {
  const t = tournament;
  const maxRound = t.rounds;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-lg font-black uppercase flex items-center gap-2">
            <Trophy size={18} className="text-[var(--gold)]" /> {t.name}
          </h2>
          <p className="font-mono text-[10px] text-[var(--inkDim)]">{t.tag} · {t.level} · Раунд {t.currentRound}/{t.rounds}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-1.5">
            <Users size={12} className="text-[var(--inkDim)]" />
            <span className="font-mono text-[10px] text-[var(--inkSoft)]">{t.players}/{t.maxPlayers}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-1.5">
            <Clock size={12} className="text-[var(--gold)]" />
            <span className="font-mono text-[10px] text-[var(--gold)]">{t.timeLeft}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-1.5">
            <Medal size={12} className="text-[var(--gold)]" />
            <span className="font-mono text-[10px] font-bold text-[var(--gold)]">{t.prizePool}</span>
          </div>
        </div>
      </div>

      {/* Bracket Visualization — horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4" style={{ minWidth: maxRound * 200 }}>
          {Array.from({ length: maxRound }, (_, i) => maxRound - i).map((round) => {
            const roundMatches = t.matches.filter((m) => m.round === round);
            if (roundMatches.length === 0) return null;
            const roundNames = ["Final", "Semi", "Quarter", `R${round}`, `R${round}`, `R${round}`, `R${round}`];

            return (
              <div key={round} className="flex flex-col gap-3 justify-center" style={{ minWidth: 180 }}>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--inkDim)] text-center">
                  {roundNames[Math.min(maxRound - round, roundNames.length - 1)]}
                </p>
                {roundMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prize distribution */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { place: "🥇 1st", prize: "2,500 $SIG + NFT", color: C.gold },
          { place: "🥈 2nd", prize: "1,250 $SIG", color: "#c0c0c0" },
          { place: "🥉 3rd", prize: "750 $SIG", color: "#cd7f32" },
        ].map((p) => (
          <div key={p.place} className="rounded-xl border border-[var(--edge)] bg-black/20 p-3 text-center">
            <p className="font-heading text-sm font-bold" style={{ color: p.color }}>{p.place}</p>
            <p className="font-mono text-[10px] text-[var(--inkSoft)] mt-1">{p.prize}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const p1 = match.player1;
  const p2 = match.player2;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border p-3 transition-all ${
        match.status === "live" ? "border-[var(--signal)]/40 bg-[var(--signal)]/5 animate-pulse-glow" :
        match.status === "completed" ? "border-[var(--edge)] bg-black/20" :
        "border-[var(--edge)] bg-black/10 opacity-60"
      }`}
    >
      {/* Player 1 */}
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${
        match.winner === "p1" ? "bg-[var(--long)]/10 border border-[var(--long)]/20" :
        match.winner === "p2" ? "opacity-50" : ""
      }`}>
        <span className="text-lg">{p1.avatar}</span>
        <span className={`font-mono text-[11px] font-semibold flex-1 truncate ${
          match.winner === "p1" ? "text-[var(--long)]" : "text-[var(--inkSoft)]"
        }`}>{p1.name}</span>
        {p1.score !== null && <span className="font-mono text-[11px] font-bold text-[var(--ink)]">{p1.score}</span>}
        {match.winner === "p1" && <span className="text-[var(--long)] text-xs">✓</span>}
      </div>

      {/* VS divider */}
      <div className="flex items-center gap-2 my-1.5 px-2">
        <div className="h-px flex-1 bg-[var(--edge)]" />
        <span className="font-mono text-[9px] text-[var(--inkDim)]">
          {match.status === "live" ? "⚡ LIVE" : match.status === "completed" ? "DONE" : "PENDING"}
        </span>
        <div className="h-px flex-1 bg-[var(--edge)]" />
      </div>

      {/* Player 2 */}
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${
        match.winner === "p2" ? "bg-[var(--long)]/10 border border-[var(--long)]/20" :
        match.winner === "p1" ? "opacity-50" : ""
      }`}>
        <span className="text-lg">{p2.avatar}</span>
        <span className={`font-mono text-[11px] font-semibold flex-1 truncate ${
          match.winner === "p2" ? "text-[var(--long)]" : "text-[var(--inkSoft)]"
        }`}>{p2.name}</span>
        {p2.score !== null && <span className="font-mono text-[11px] font-bold text-[var(--ink)]">{p2.score}</span>}
        {match.winner === "p2" && <span className="text-[var(--long)] text-xs">✓</span>}
      </div>
    </motion.div>
  );
}
