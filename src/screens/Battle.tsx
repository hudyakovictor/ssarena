import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Shield, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, Swords, Ghost, RefreshCw, Users } from "lucide-react";
import type { Screen } from "../App";
import { MARKET_ENTITIES, THREAT_COLORS, ARCHETYPES, C, MOCK_PLAYER, RANKS } from "../lib/data";
import { ACTIVE_PROFILE } from "../lib/marketProfile";
import { TradingChart, generateMockCandles } from "../components/TradingChart";
import { useBattle } from "../hooks/useBattle";
import { useBattleSession } from "../hooks/useBattleSession";
import { useWebSocket } from "../hooks/useWebSocket";
import { useT } from "../i18n";
import { LoadingSkeleton, ErrorRetry } from "../components/LoadingSkeleton";

export function Battle({ player, setScreen }: { player: typeof MOCK_PLAYER; setScreen: (s: Screen) => void }) {
  const { t } = useT();
  const playerId: string = player?.id || "demo";
  const ws = useWebSocket(playerId, player.rankIndex);
  const session = useBattleSession();
  const b = useBattle(playerId, player.rankIndex, { serverScenario: session.session.scenario ? {
    entityId: session.session.scenario.entity_id,
    briefing: session.session.scenario.briefing,
    asset: session.session.scenario.asset,
    options: (session.session.scenario.options || []).map((o: any) => ({
      id: o.id, label: o.label, layer1: o.layer1, layer2: o.layer2, layer3: o.layer3,
    })),
  } : null });

  // Server-backed battle lifecycle (block 1.2/1.5): start session, submit to server.
  const beginBattle = (mode: "daily" | "ghost" | "live" | "training") => {
    b.startBattle(mode);
    session.start(playerId, mode).then((res) => {
      if (res?.scenario?.options?.length) return;
      // server down or no scenario — local mode silently continues
    });
  };
  const submitLocal = (optId: string) => {
    if (session.session.sessionId) {
      // server grades: pass the submit callback into local state so result screen works
      return b.submitDecision(optId, (id) => session.submitDecision(id));
    }
    return b.submitDecision(optId);
  };

  useEffect(() => {
    if (b.mode === "live" && ws.duel.roomId) {
      ws.onOpponent((action) => {
        if (action.action === "source_toggle") b.toggleSource(action.payload.sourceId);
        if (action.action === "decision") b.submitDecision(action.payload.optionId);
      });
    }
  }, [b.mode, ws.duel.roomId]);

  return (
    <div className="space-y-5 pb-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen("arena")} className="btn-ghost p-2"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-black uppercase">{t('common.menu_arena')}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-[10px] text-[var(--inkDim)]">{b.profileAsset} · R{b.currentRound}/3</span>
            {b.mode === "live" && (
              <span className="pill" style={{ background: `${C.pink}1a`, color: C.pink, border: `1px solid ${C.pink}44` }}>
                <Ghost size={10} /> vs {ws.duel.opponent?.name || "???"}
              </span>
            )}
            <span className="pill" style={{ background: `${b.arch.color}1a`, color: b.arch.color, border: `1px solid ${b.arch.color}44` }}>
              {b.arch.glyph} Lv.{b.entityLevel}
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${ws.connected ? "bg-[var(--long)]" : "bg-[var(--short)]"}`} />
            <span className="font-mono text-[9px] text-[var(--inkDim)]">{ws.connected ? t('common.online') : t('common.offline')}</span>
          </div>
        </div>
        {(b.phase === "battle" || b.phase === "twist" || b.phase === "result") && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5">
              <Clock size={13} className={b.timeLeft < 10 ? "text-[var(--short)] animate-pulse" : "text-[var(--signal)]"} />
              <span className="font-mono text-xs font-bold">{b.timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5">
              <Zap size={13} className="text-[var(--gold)]" />
              <span className="font-mono text-xs font-bold">{b.attentionLeft} AP</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5">
              <Shield size={13} className="text-[var(--long)]" />
              <span className="font-mono text-xs font-bold">{player.disciplineShield}%</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE — MODE SELECT */}
        {b.phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { mode: "daily", name: t('battle.daily_puzzle'), desc: "Ежедневный сценарий", icon: "🧩", color: C.signal },
                { mode: "training", name: t('battle.training'), desc: "Без потери рейтинга", icon: "🎯", color: C.long },
                { mode: "ghost", name: t('battle.ghost_duel'), desc: "Против записи игрока", icon: "👻", color: C.pink },
                { mode: "live", name: t('battle.live_duel'), desc: `${ws.presence.online} онлайн`, icon: "⚔️", color: C.short },
              ].map(({ mode, name, desc, icon, color }) => (
                <button key={String(mode)} onClick={() => beginBattle(mode as "daily" | "ghost" | "live" | "training")}
                  className="panel p-5 text-center hover:scale-[1.02] transition-transform">
                  <span className="text-3xl">{icon}</span>
                  <p className="mt-2 font-heading text-sm font-bold">{name}</p>
                  <p className="text-xs text-[var(--inkSoft)]">{desc}</p>
                </button>
              ))}
            </div>
            {b.mode === "live" && ws.duel.phase === "queued" && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="panel p-6 text-center border-2 border-[var(--signal)]/40">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mx-auto h-12 w-12 rounded-full border-2 border-[var(--signal)] border-t-transparent mb-4" />
                <p className="font-heading text-lg font-bold">{t('battle.searching_opponent')}</p>
                <p className="text-sm text-[var(--inkSoft)] mt-1">{t('battle.queue_position')}: {ws.duel.queuePosition}</p>
                <button onClick={ws.cancelQueue} className="btn-ghost mt-4 px-6 py-2 text-sm">{t('common.btn_cancel')}</button>
              </motion.div>
            )}
            {b.mode === "live" && ws.duel.phase === "matched" && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="panel p-6 text-center border-2 border-[var(--long)]/40">
                <span className="text-4xl">⚔️</span>
                <p className="font-heading text-lg font-bold text-[var(--long)] mt-3">{t('battle.opponent_found')}</p>
                <button onClick={() => { b.goToBattle(); ws.joinBattleRoom(ws.duel.roomId!, "player"); }} className="btn-primary mt-4 px-6"><Swords size={14} /> В бой!</button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PREBATTLE — SCP Dossier */}
        {b.phase === "prebattle" && (
          <motion.div key="prebattle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="panel" style={{ borderColor: `${THREAT_COLORS[b.entity.threatLevel]}44` }}>
              <div className="flex items-center gap-3 border-b border-[var(--edge)] px-5 py-3" style={{ backgroundColor: `${THREAT_COLORS[b.entity.threatLevel]}08` }}>
                <AlertTriangle size={18} style={{ color: THREAT_COLORS[b.entity.threatLevel] }} />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]" style={{ color: THREAT_COLORS[b.entity.threatLevel] }}>{t('battle.entity_detected')}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-5 flex-wrap">
                  <EntityPortrait entity={b.entity} arch={b.arch} />
                  <div className="flex-1 min-w-[250px]">
                    <h2 className="font-display text-lg font-black uppercase" style={{ color: b.arch.color }}>{b.entity.nameRu}</h2>
                    <p className="font-mono text-[10px] text-[var(--inkDim)]">Class: {b.entity.archetype.toUpperCase()} · Threat: {b.entity.threatLevel} · Corruption: {b.entity.corruption}%</p>
                    <p className="mt-2 text-sm text-[var(--inkSoft)]">{b.entity.description}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[var(--short)]/20 bg-[var(--short)]/5 p-3">
                        <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--short)]">Expected Mistakes</p>
                        {b.entity.expectedMistakes.map((m: string) => <p key={m} className="mt-1 font-mono text-[10px] text-[var(--inkSoft)]">• {m}</p>)}
                      </div>
                      <div className="rounded-xl border border-[var(--long)]/20 bg-[var(--long)]/5 p-3">
                        <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--long)]">Counters</p>
                        {b.entity.counterCards.map((c: string) => <p key={c} className="mt-1 font-mono text-[10px] text-[var(--inkSoft)]">• {c}</p>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={b.goToBattle} className="btn-primary w-full py-3 text-base"><Swords size={18} /> {t('common.btn_battle')}</button>
          </motion.div>
        )}

        {/* BATTLE + TWIST */}
        {(b.phase === "battle" || b.phase === "twist") && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="panel p-4"><TradingChart data={b.candles} height={260} resistanceLevel={3420} showFOMOWarning /></div>
            {b.phase === "twist" && b.twistEvent && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="panel p-5 border-2" style={{ borderColor: `${C.short}66` }}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{b.twistEvent.icon}</span>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--short)]">{t('battle.twist_event')}</p>
                    <p className="mt-1 font-heading text-base font-bold">{b.twistEvent.text}</p>
                    <p className="font-mono text-[10px] text-[var(--inkSoft)]">+10 секунд.</p>
                  </div>
                </div>
              </motion.div>
            )}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">{t('battle.data_sources')} ({b.attentionLeft} AP)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {ACTIVE_PROFILE.sources.map((src) => {
                  const isOpen = b.openedSources.has(src.id);
                  const hasData = b.scenarioFacts[src.id];
                  return (
                    <button key={src.id} onClick={() => { hasData && b.toggleSource(src.id); if (b.mode === "live") ws.sendBattleAction(ws.duel.battleId!, "source_toggle", { sourceId: src.id }); }}
                      className={`rounded-xl border p-3 text-left transition-all ${!hasData ? "opacity-30 cursor-not-allowed" : isOpen ? "border-[var(--signal)]/40 bg-[var(--signal)]/5" : "border-[var(--edge)] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                      <div className="flex items-center justify-between"><span className="text-lg">{src.glyph}</span>{isOpen ? <EyeOff size={12} className="text-[var(--signal)]" /> : <Eye size={12} className="text-[var(--inkDim)]" />}</div>
                      <p className="mt-1 font-mono text-[10px] font-semibold">{src.name}</p><p className="font-mono text-[9px] text-[var(--inkDim)]">{src.cost} AP</p>
                      {isOpen && hasData && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 font-mono text-[9px] leading-relaxed text-[var(--signal)]/80">{b.scenarioFacts[src.id]}</motion.p>}
                    </button>
                  );
                })}
              </div>
            </div>
            {!b.showResult && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">{t('battle.your_decision')}</p>
                <div className="grid gap-2">
                  {b.scenarioOptions.map((opt) => (
                    <button key={opt.id} onClick={() => { submitLocal(opt.id); if (b.mode === "live") ws.sendBattleAction(ws.duel.battleId!, "decision", { optionId: opt.id }); }}
                      className="panel p-4 text-left hover:border-[var(--signal)]/40 transition-all cursor-pointer group">
                      <span className="font-mono text-[10px] font-bold text-[var(--signal)] mr-2">{opt.short}.</span>
                      <span className="font-heading text-sm font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* RESULT — Terminal Voice */}
        {b.showResult && b.option && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="panel overflow-hidden border-2" style={{ borderColor: b.isCorrect ? `${C.long}44` : `${C.short}44` }}>
              <div className={`px-5 py-3 border-b flex items-center gap-2 ${b.isCorrect ? "bg-[var(--long)]/5 border-[var(--long)]/20" : "bg-[var(--short)]/5 border-[var(--short)]/20"}`}>
                {b.isCorrect ? <CheckCircle2 size={20} className="text-[var(--long)]" /> : <XCircle size={20} className="text-[var(--short)]" />}
                <span className={`font-display text-sm font-black uppercase ${b.isCorrect ? "text-[var(--long)]" : "text-[var(--short)]"}`}>{b.option.layer1}</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--signal)]">▸ TERMINAL VOICE</p>
                  <p className="mt-1 font-heading text-lg font-bold italic text-white/85">«{b.option.layer2}»</p>
                </div>
                <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--long)]">📋 ANALYSIS</p>
                  <p className="mt-2 text-sm text-[var(--inkSoft)] leading-relaxed">{b.option.layer3}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["FOMO Resist", b.isCorrect ? "+3" : "-2", b.isCorrect ? C.long : C.short],["Discipline", b.isCorrect ? "+2" : "-3", b.isCorrect ? C.long : C.short],["Timing", b.isCorrect ? "+1" : "-1", b.isCorrect ? C.long : C.short]].map(([s,d,c])=>(
                    <div key={s as string} className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center"><p className="font-mono text-[10px] text-[var(--inkSoft)]">{s}</p><p className="font-display text-lg font-bold" style={{color:c as string}}>{d}</p></div>
                  ))}
                </div>
                {b.isCorrect && (
                  <div className="rounded-xl border border-[var(--long)]/20 bg-[var(--long)]/5 p-4 flex items-center gap-4">
                    <span className="text-4xl">{b.entity.glyph}</span>
                    <div><p className="font-heading text-sm font-bold text-[var(--long)]">{b.entity.nameRu} — NEUTRALIZED</p><p className="font-mono text-[10px] text-[var(--inkSoft)]">+{Math.round(b.entity.corruption*1.5)} XP · Lv.{b.entityLevel}</p></div>
                  </div>
                )}
              </div>
            </div>
            <div className="panel p-5 text-center space-y-3">
              <p className="font-display text-lg font-black text-[var(--signal)]">«{b.isCorrect?"Discipline > Impulse":"The market teaches through loss"}»</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => beginBattle(b.mode as "daily" | "ghost" | "live" | "training")} className="btn-primary px-6"><RefreshCw size={14} /> {t('common.btn_retry')}</button>
                <button onClick={() => setScreen("bestiary")} className="btn-ghost px-6">{t('common.menu_bestiary')}</button>
                {b.isCorrect && <button className="btn-gold px-6 text-sm">{t('common.btn_share')}</button>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntityPortrait({ entity, arch }: { entity: any; arch: any }) {
  const imgMap: Record<string,string> = {
    "fomo-wraith":"/images/entity-fomo-wraith.jpg","fake-breakout-phantom":"/images/entity-fake-breakout-phantom.jpg",
    "liquidity-hydra":"/images/entity-liquidity-hydra.jpg","honeypot-mimic":"/images/entity-honeypot-mimic.jpg",
    "leverage-goblin":"/images/entity-leverage-goblin.jpg","headline-titan":"/images/entity-headline-titan.jpg",
    "rug-pull-phantom":"/images/entity-rug-pull-phantom.jpg","whale-syndicate":"/images/entity-whale-syndicate.jpg",
    "hubris-dragon":"/images/entity-hubris-dragon.jpg","narrative-siren":"/images/entity-narrative-siren.jpg",
  };
  const img = imgMap[entity.id];
  if (img) return <div className="flex h-40 w-32 shrink-0 overflow-hidden rounded-2xl border-2" style={{borderColor:`${arch.color}66`}}><img src={img} alt={entity.name} className="w-full h-full object-cover" loading="lazy"/></div>;
  return <div className="flex h-40 w-32 items-center justify-center rounded-2xl" style={{background:`radial-gradient(circle at 50% 35%, ${arch.color}55, rgba(5,7,15,0.9))`,border:`2px solid ${arch.color}66`}}><span className="text-6xl" style={{filter:`drop-shadow(0 0 12px ${arch.color})`}}>{entity.glyph}</span></div>;
}
