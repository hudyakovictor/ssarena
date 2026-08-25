// ============================================================
// SIGNAL ARENA V2 — MAIN APPLICATION
// AAA+ GameFi 2.0 · Proof of Skill · Educational Trading Arena
// ============================================================
import { useState, lazy, Suspense, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { TopBar } from "./components/TopBar";
import { PriceTicker } from "./components/PriceTicker";
import { Dashboard } from "./screens/Dashboard";
import { Academy } from "./screens/Academy";
import { Arena } from "./screens/Arena";
import { SettingsScreen } from "./screens/Settings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceBanner, useMaintenance } from "./components/MaintenanceBanner";
import { getState, subscribe, setState } from "./lib/gameState";
import { usePlayer } from "./hooks/usePlayer";
import { usePlayerProfile } from "./hooks/usePlayerProfile";
import { useT, setLocale } from "./i18n";
import { api } from "./lib/api";

// ── Admin-only screens (zero bundle cost in production) ──
const isAdmin = import.meta.env.VITE_ADMIN_ENABLED === "true";
const Admin = isAdmin ? lazy(() => import("./screens/Admin").then(m => ({ default: m.Admin }))) : null;
const OverseerDashboard = isAdmin ? lazy(() => import("./screens/Overseer").then(m => ({ default: m.OverseerDashboard }))) : null;

// ── Player screens (lazy-loaded) ──
const Battle = lazy(() => import("./screens/Battle").then(m => ({ default: m.Battle })));
const Collection = lazy(() => import("./screens/Collection").then(m => ({ default: m.Collection })));
const Bestiary = lazy(() => import("./screens/Bestiary").then(m => ({ default: m.Bestiary })));
const Profile = lazy(() => import("./screens/Profile").then(m => ({ default: m.Profile })));
const Market = lazy(() => import("./screens/Market").then(m => ({ default: m.Market })));
const Onboarding = lazy(() => import("./screens/Onboarding").then(m => ({ default: m.Onboarding })));

function ScreenFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 rounded-full border-2 border-[var(--signal)] border-t-transparent"
      />
    </div>
  );
}

export type Screen = "home" | "academy" | "arena" | "battle" | "collection" | "bestiary" | "profile" | "market" | "onboarding" | "settings" | "admin" | "overseer";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sa_sidebar_collapsed") === "1"; } catch { return false; }
  });
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sa_sidebar_collapsed", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  }, []);
  const maintenance = useMaintenance();
  const [playerState, setPlayerState] = useState(getState());
  const { player: playerAuth } = usePlayer();
  const { profile: serverProfile, refresh: refreshProfile } = usePlayerProfile(playerAuth.playerId);
  const { setLocale: setI18nLocale } = useT();

  // Block 4.1: rejoin with a friend's code (binds this player as referee).
  const [rejoinStatus, setRejoinStatus] = useState<string | null>(null);
  const handleRejoin = useCallback(async (code: string) => {
    const pid = playerAuth.playerId;
    if (!pid) { setRejoinStatus("Сначала войди как гость"); return; }
    try {
      const r: any = await api.activateReferral(pid, code);
      setRejoinStatus(`✓ Присоединён к ${r.code}: +${r.welcome?.credited ?? 5} $SIG новичку, +${r.reward?.credited ?? 10} другу`);
      refreshProfile();
    } catch (e: any) {
      const msg = (e as any)?.message || "Ошибка";
      setRejoinStatus(
        msg === "already linked" ? "Этот аккаунт уже привязан к коду"
        : msg === "invalid code" ? "Код не найден — проверь написание"
        : msg === "self referral" ? "Нельзя привязать свой собственный код"
        : `Ошибка: ${msg}`
      );
    }
  }, [playerAuth.playerId, refreshProfile]);

  // Block 2.4: pull the real server profile into local state.
  // (usePlayerProfile already syncs once per identity on mount; we
  // also refresh when the user opens the Profile tab so numbers are fresh.)
  useEffect(() => {
    if (playerAuth.playerId && (screen === "profile" || screen === "home")) {
      refreshProfile();
    }
  }, [screen, playerAuth.playerId, refreshProfile]);

  // Bind the server-issued playerId into local state (block 1.4)
  useEffect(() => {
    if (playerAuth.playerId && getState().id !== playerAuth.playerId) {
      setState({ id: playerAuth.playerId, name: playerAuth.displayName || getState().name });
    }
  }, [playerAuth.playerId, playerAuth.displayName]);

  // Subscribe to state changes
  useEffect(() => {
    const unsub = subscribe(() => {
      setPlayerState(getState());
    });
    return unsub;
  }, []);

  // Sync locale
  useEffect(() => {
    setLocale(playerState.language);
    setI18nLocale(playerState.language);
  }, [playerState.language]);

  // Block 2.4: real server profile wins over local-derived values
  const sp = serverProfile as any;
  const localRating = 1000
    + Math.floor(playerState.xp / 10)
    + playerState.wins * 15
    - playerState.losses * 10
    + Math.min(playerState.streak * 5, 100); // mirrors getRating() exactly
  const realRating = typeof sp?.rating === "number" ? sp.rating : localRating;
  const realErrors = Array.isArray(sp?.errors) && sp.errors.length
    ? sp.errors.map((e: any) => ({
        id: e.error_id,
        title: e.error_title || e.error_id,
        count: e.count || 1,
        status: e.status || "active",
        domain: e.domain || "battle",
      }))
    : [
        { id: 'e1', title: 'FOMO Entry', count: 8, status: 'improving' as const, domain: 'psychology' },
        { id: 'e2', title: 'No Invalidation', count: 5, status: 'active' as const, domain: 'risk' },
        { id: 'e3', title: 'Ignored Volume', count: 3, status: 'improving' as const, domain: 'ta' },
        { id: 'e4', title: 'Overconfidence', count: 4, status: 'controlled' as const, domain: 'psychology' },
      ];

  // Create a player-compatible object from state
  const player = {
    ...playerState,
    name: sp?.display_name || playerState.name,
    rankIndex: playerState.rankIndex,
    xp: playerState.xp,
    attention: playerState.attention,
    maxAttention: playerState.maxAttention,
    disciplineShield: playerState.disciplineShield,
    streak: playerState.streak,
    winRate: playerState.battles > 0 ? Math.round((playerState.wins / playerState.battles) * 100) : 0,
    rating: realRating,
    skills: Object.entries(playerState.skillValues).map(([id, value]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      value,
      color: '#22d3ee',
    })),
    errors: realErrors,
    entityHistory: playerState.entityHistory,
    badges: playerState.achievements.filter(a => a.unlocked).map(a => ({
      id: a.id,
      name: a.name,
      glyph: a.glyph,
      color: '#fbbf24',
      rarity: a.rarity,
      earned: a.unlocked,
    })),
  };

  return (
    <ErrorBoundary>
      <MaintenanceBanner state={maintenance.state} onDismiss={maintenance.endMaintenance} />
      <div className="flex min-h-screen bg-[var(--void)] text-[var(--ink)]">
        <Sidebar screen={screen} setScreen={setScreen} player={player} isAdmin={isAdmin} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <div className="min-w-0 flex-1">
          <TopBar player={player} onRejoin={handleRejoin} rejoinStatus={rejoinStatus} />
          <PriceTicker />
          <main className="mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<ScreenFallback />}>
                  {screen === "home" && <Dashboard setScreen={setScreen} player={player} />}
                  {screen === "academy" && <Academy player={player} setScreen={setScreen} />}
                  {screen === "arena" && <Arena player={player} setScreen={setScreen} />}
                  {screen === "battle" && <Battle player={player} setScreen={setScreen} />}
                  {screen === "collection" && <Collection player={player} />}
                  {screen === "bestiary" && <Bestiary player={player} />}
                  {screen === "profile" && <Profile player={player} />}
                  {screen === "market" && <Market />}
                  {screen === "onboarding" && <Onboarding setScreen={setScreen} />}
                  {screen === "settings" && <SettingsScreen />}
                  {screen === "admin" && Admin && <Admin />}
                  {screen === "overseer" && OverseerDashboard && <OverseerDashboard />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <MobileNav screen={screen} setScreen={setScreen} />
      </div>
    </ErrorBoundary>
  );
}
