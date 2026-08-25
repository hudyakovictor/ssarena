import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2, Gift, Link, Send, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

// ============================================================
// REFERRAL SYSTEM (block 4.1) — server-backed.
// Live data: GET /api/referral/status (code, $SIG ledger, links).
// Offline fallback: deterministic local code, zero stats.
// Reward values come from the SERVER (state.rewards) — the UI
// only renders the contract, the numbers are not hardcoded twice.
// ============================================================
interface ReferralState {
  code: string | null;
  referralLink: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  sig: { balance: number; earned: number; ledger: Array<{ amount: number; reason: string; created_at: string }> };
  rewards: { signupBonus: number; refereeSignupBonus: number; rank5Bonus: number; premiumBonus: number } | null;
}

const FallbackRewards = { signupBonus: 10, refereeSignupBonus: 5, rank5Bonus: 50, premiumBonus: 100 };
const LEDGER_LABEL: Record<string, string> = {
  referral_signup: "Пригласил друга",
  referee_welcome: "Бонус новичку",
  referral_rank5: "Друг достиг Rank 5",
  referral_premium: "Друг купил Premium",
};

function localCode(seed: string): string {
  let h = 2166136261;
  const s = (seed || "").toUpperCase();
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  const CH = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let t = h >>> 0;
  let out = "";
  for (let i = 0; i < 6; i++) { t = (Math.imul(t, 16807) % 2147483647) >>> 0; out += CH[t % CH.length]; }
  return "SIGMA" + out;
}

const STAT_CELLS: Array<{ key: string; label: string }> = [
  { key: "total", label: "Приглашено" },
  { key: "active", label: "Активных" },
  { key: "earned", label: "Заработано" },
];

export function ReferralSystem({ playerId, onRejoin, rejoinStatus }: { playerId?: string; onRejoin?: (code: string) => void; rejoinStatus?: string | null }) {
  const [referral, setReferral] = useState<ReferralState | null>(null);
  const [offline, setOffline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const seed = playerId || "demo";
  const load = useCallback(async () => {
    if (!playerId) { setOffline(true); setReferral(null); return; }
    try {
      const st = await api.getReferralStatus(playerId);
      if (st && st.code) { setReferral(st as ReferralState); setOffline(false); }
      else { setOffline(true); setReferral(null); }
    } catch { setOffline(true); setReferral(null); }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (open) load(); }, [open, load]);

  const code = referral?.code || (offline ? localCode(seed) : null);
  const referralLink = code ? `https://signalarena.io/?ref=${code}` : "";
  const rewards = referral?.rewards || FallbackRewards;
  const referralText = `🎮 Signal Arena — игра, которая делает тебя умнее, а не беднее.\n\nЯ уже прокачиваю навыки трейдинга. Присоединяйся и получи +${rewards.refereeSignupBonus} $SIG!\n\n${referralLink}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Signal Arena — играй на рынке. Не становись ликвидностью.")}`;
    window.open(url, "_blank", "width=600,height=400");
  };
  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(referralText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const joinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const c = codeInput.trim().toUpperCase();
    if (!c || !onRejoin) return;
    onRejoin(c);
    setOpen(false);
  };

  const balance = referral?.sig.balance ?? 0;
  const earned = referral?.sig.earned ?? 0;
  const statValue = (k: string): string | number =>
    k === "total" ? referral?.totalReferrals ?? 0
    : k === "active" ? referral?.completedReferrals ?? 0
    : `${earned} $SIG`;

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-3 py-1.5 transition-all hover:bg-[var(--gold)]/10 text-xs"
      >
        <Gift size={14} className="text-[var(--gold)]" />
        <span className="font-mono font-semibold text-[var(--gold)]">Рефералы</span>
        {balance > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--long)] text-[10px] font-bold text-white">
            {balance}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[var(--edge)] bg-[var(--night)] p-5 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-black uppercase flex items-center gap-2">
                <Gift size={14} className="text-[var(--gold)]" /> Реферальная программа
              </h3>
              <div className="flex items-center gap-2">
                {offline && (
                  <button onClick={load} title="Повторить" className="text-[var(--inkDim)] hover:text-[var(--signal)]">
                    <RefreshCw size={12} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[var(--inkDim)] text-xs hover:text-[var(--ink)]">✕</button>
              </div>
            </div>

            {offline && (
              <p className="font-mono text-[9px] text-[var(--inkDim)] mb-3 rounded-lg bg-black/20 px-2 py-1.5">
                Офлайн: код локальный, статистика появится после подключения к серверу.
              </p>
            )}

            {/* Referral code */}
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-3 mb-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)]">Твой код</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-display text-lg font-bold text-[var(--gold)] tracking-widest">{code || "—"}</span>
                <button onClick={copyLink} className="ml-auto rounded-lg border border-[var(--edge)] p-1.5 hover:border-[var(--signal)]/30 transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-[var(--long)]" /> : <Copy size={14} className="text-[var(--inkDim)]" />}
                </button>
              </div>
              <p className="font-mono text-[9px] text-[var(--inkDim)] mt-1 truncate">{referralLink}</p>
              <p className="font-mono text-[8px] text-[var(--inkDim)]/70 mt-1">
                Отправь ссылку другу — он открывает её при первом входе и вы оба получаете $SIG.
              </p>
            </div>

            {/* Rewards table (server values) */}
            <div className="space-y-2 mb-4">
              {[
                ["Регистрация друга", `+${rewards.signupBonus} $SIG`],
                ["Друг достиг Rank 5", `+${rewards.rank5Bonus} $SIG`],
                ["Друг купил Premium", `+${rewards.premiumBonus} $SIG`],
                ["Бонус новому игроку", `+${rewards.refereeSignupBonus} $SIG`],
              ].map(([action, reward]) => (
                <div key={action} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--inkSoft)]">{action}</span>
                  <span className="font-mono font-bold text-[var(--gold)]">{reward}</span>
                </div>
              ))}
            </div>

            {/* Stats (live) */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {STAT_CELLS.map(({ key, label }) => (
                <div key={key} className="rounded-lg bg-black/30 py-2 text-center">
                  <p className="font-display text-lg font-bold text-[var(--signal)]">{statValue(key)}</p>
                  <p className="font-mono text-[8px] text-[var(--inkDim)]">{label}</p>
                </div>
              ))}
            </div>

            {/* Ledger (live, latest) */}
            {referral && referral.sig.ledger.length > 0 && (
              <div className="mb-4 rounded-xl border border-[var(--edge)] bg-black/20 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Последние начисления</p>
                <div className="space-y-1">
                  {referral.sig.ledger.slice(0, 4).map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--inkSoft)] truncate">{LEDGER_LABEL[l.reason] || l.reason}</span>
                      <span className={`font-mono font-bold ${l.amount > 0 ? "text-[var(--long)]" : "text-[var(--short)]"}`}>
                        {l.amount > 0 ? "+" : ""}{l.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join as referred player */}
            {onRejoin && (
              <form onSubmit={joinWithCode} className="mb-4 rounded-xl border border-[var(--edge)] bg-black/20 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)] mb-2">У тебя есть код друга?</p>
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="SIGMA…"
                    className="flex-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2 py-1.5 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--gold)]/50"
                  />
                  <button type="submit" className="btn-ghost px-3 text-xs">Присоединиться</button>
                </div>
                <p className="font-mono text-[8px] text-[var(--inkDim)]/70 mt-1.5">
                  Сработает сразу или при следующем входе: аккаунт привяжется к коду (+{rewards.refereeSignupBonus} $SIG тебе, +{rewards.signupBonus} другу).
                </p>
                {rejoinStatus && (
                  <p className="font-mono text-[9px] text-[var(--long)] mt-1.5">{rejoinStatus}</p>
                )}
              </form>
            )}

            {/* Share buttons */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Поделиться</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={copyLink}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[var(--edge)] bg-white/[0.02] py-2 text-xs hover:bg-white/[0.04] transition-colors">
                  <Link size={12} className="text-[var(--signal)]" /> Ссылка
                </button>
                <button onClick={shareTwitter}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[var(--edge)] bg-white/[0.02] py-2 text-xs hover:bg-white/[0.04] transition-colors">
                  <Send size={12} className="text-[var(--signal)]" /> Twitter
                </button>
                <button onClick={shareTelegram}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[var(--edge)] bg-white/[0.02] py-2 text-xs hover:bg-white/[0.04] transition-colors">
                  <Send size={12} className="text-[var(--signal)]" /> Telegram
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { ReferralState };
