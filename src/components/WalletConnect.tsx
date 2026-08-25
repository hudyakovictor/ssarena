// ============================================================
// WALLET CONNECT — DEMO (BLOCK 4.2)
// ROADMAP: «бумажный» (demo) режим — NO real keys, no provider,
// no network wallet. The paper address is derived server-side
// (sha256 of playerId) via POST /api/auth/wallet-demo and bound
// to the existing player (progress is NOT reset).
// A real Web3 login is a separate legal branch — out of phase.
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ChevronDown, Copy, CheckCircle2, Shield, User, Sparkles } from "lucide-react";
import { api } from "../lib/api";

type WalletState = {
  connected: boolean;
  address: string | null;
  demo: boolean;
  mode: "guest" | "wallet";
  ensName: string | null;
};

const DEMO_NOTES = {
  ru_title: "Демо-кошелёк (бумажный)",
  ru_body: "Адрес создан демонстрационно: без реальных ключей и без сети. Прогресс игрока сохраняется. Настоящий Web3-вход — отдельная юридическая ветка.",
};

export function WalletConnect({ playerId, displayName }: {
  playerId?: string;
  displayName?: string;
}) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false, address: null, demo: false, mode: "guest", ensName: null,
  });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server is the source of truth for whether this player has a paper wallet.
  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    (async () => {
      try {
        const p: any = await api.getPlayer(playerId);
        if (!cancelled && p?.wallet_addr) {
          setWallet((w) => ({ ...w, connected: true, address: p.wallet_addr, demo: true, mode: "wallet" }));
        }
      } catch { /* offline — stay guest */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const connectDemo = useCallback(async () => {
    if (!playerId) { setError("Нет аккаунта — войди как гость"); return; }
    setLoading(true); setError(null);
    try {
      const res: any = await api.walletDemo(playerId, displayName);
      setWallet({ connected: true, address: res.address, demo: true, mode: "wallet", ensName: null });
    } catch (e: any) {
      setError(e?.message || "Не удалось создать демо-кошелёк");
    }
    setLoading(false);
  }, [playerId, displayName]);

  const disconnect = useCallback(async () => {
    if (playerId) {
      try { await api.walletDemoDisconnect(playerId); } catch { /* best effort */ }
    }
    setWallet({ connected: false, address: null, demo: false, mode: "guest", ensName: null });
  }, [playerId]);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayName_ = wallet.mode === "wallet" && wallet.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : (displayName || "Гость");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all text-xs ${
          wallet.mode === "wallet" ? "border-[var(--long)]/30 bg-[var(--long)]/5" : "border-[var(--edge)] bg-white/[0.02]"
        }`}
      >
        {wallet.mode === "wallet" ? (
          <>
            <div className="h-2 w-2 rounded-full bg-[var(--long)] animate-pulse" />
            <Wallet size={14} className="text-[var(--long)]" />
            <span className="font-mono font-semibold text-[var(--ink)] hidden sm:inline">{displayName_}</span>
            <span className="rounded bg-[var(--long)]/15 px-1 py-0.5 font-mono text-[8px] font-bold text-[var(--long)]">DEMO</span>
          </>
        ) : (
          <>
            <User size={14} className="text-[var(--inkDim)]" />
            <span className="font-mono text-[var(--inkDim)] hidden sm:inline">{displayName_}</span>
          </>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--edge)] bg-[var(--night)] p-4 shadow-2xl z-50"
          >
            {wallet.mode === "wallet" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--grape)] to-[var(--signal)]">
                    <Wallet size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-bold">{displayName_}</p>
                    <p className="font-mono text-[10px] text-[var(--inkDim)]">{DEMO_NOTES.ru_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                  <span className="font-mono text-[10px] text-[var(--inkSoft)] flex-1 truncate">{wallet.address}</span>
                  <button onClick={copyAddress} className="text-[var(--inkDim)] hover:text-[var(--signal)]">
                    {copied ? <CheckCircle2 size={12} className="text-[var(--long)]" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="rounded-lg bg-[var(--long)]/5 p-2 flex items-start gap-2">
                  <Shield size={14} className="text-[var(--long)] mt-0.5" />
                  <span className="font-mono text-[10px] text-[var(--long)]">Reputation: Soulbound (demo)</span>
                </div>
                <p className="font-mono text-[9px] text-[var(--inkDim)] leading-relaxed">{DEMO_NOTES.ru_body}</p>
                <button onClick={disconnect} className="btn-ghost w-full py-2 text-xs text-[var(--short)]">
                  <LogOut size={12} /> Отключить
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-mono text-[10px] text-[var(--inkSoft)] leading-relaxed">
                  Играй как гость или подключи <b>демо-кошелёк</b> для Soulbound-репутации.
                </p>
                <button onClick={connectDemo} disabled={loading} className="btn-gold w-full py-2 text-xs flex items-center justify-center gap-2">
                  {loading ? <Sparkles size={14} className="animate-spin" /> : <Wallet size={14} />}
                  {loading ? "Создаём…" : "Connect Wallet (demo)"}
                </button>
                {error && <p className="font-mono text-[10px] text-[var(--short)]">{error}</p>}
                <p className="font-mono text-[9px] text-[var(--inkDim)] text-center">
                  Бумажный адрес · без реальных ключей · прогресс сохраняется 📱
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { WalletState };
