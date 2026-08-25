// ============================================================
// SIGNAL ARENA — DASHBOARD SCREEN
// Home screen with stats, streaks, AI recommendations, entity of the day
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, Zap, Trophy, TrendingUp, Swords, BookOpen, BarChart3, 
  Target, Star, ArrowRight, Clock, Shield, Award, Brain, Users,
  ChevronRight, Sparkles
} from 'lucide-react';
import type { Screen } from '../App';
import { useT } from '../i18n';
import { 
  getState, getCurrentRank, getXpProgress, getWinRate, getMasteredEntities,
  getDefeatedEntities, getRating, MARKET_ENTITIES, MARKET_CONDITIONS, SKILLS
} from '../lib/gameState';
import { C } from "../lib/data";
import { LeaderboardPanel } from "../components/LeaderboardPanel";

interface DashboardProps {
  setScreen: (s: Screen) => void;
  player: any;
}

// ── ENTITY OF THE DAY (deterministic rotation) ──
function getEntityOfDay() {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return MARKET_ENTITIES[dayIndex % MARKET_ENTITIES.length];
}

// ── AI RECOMMENDATION ENGINE ──
function getAIRecommendation(state: ReturnType<typeof getState>) {
  const skills = state.skillValues;
  const weakest = Object.entries(skills)
    .sort(([,a],[,b]) => a - b)[0];
  
  if (!weakest) return { text: 'Start your first battle to get recommendations!', entity: null };
  
  const [skillId, value] = weakest;
  const skill = SKILLS.find(s => s.id === skillId);
  const relatedEntities = MARKET_ENTITIES.filter(e => {
    const disciplineMap: Record<string, string[]> = {
      ta: ['chart', 'timing'],
      derivatives: ['risk', 'liquidity'],
      fundamental: ['macro', 'onchain'],
      psychology: ['fomo', 'discipline'],
      security: ['security', 'tokenomics'],
    };
    return disciplineMap[e.discipline]?.includes(skillId);
  });
  
  const entity = relatedEntities[0] || MARKET_ENTITIES[0];
  
  return {
    text: `Your ${skill?.name || skillId} is at ${value}%. Try 3 training battles with ${entity.nameRu} to improve.`,
    entity,
    skill,
    value,
  };
}

export function Dashboard({ setScreen }: DashboardProps) {
  const { t } = useT();
  const [state, setState] = useState(getState());
  const entityOfDay = getEntityOfDay();
  const rank = getCurrentRank();
  const xpProgress = getXpProgress();
  const winRate = getWinRate();
  const mastered = getMasteredEntities();
  const defeated = getDefeatedEntities();
  const rating = getRating();
  const aiRec = getAIRecommendation(state);
  const conditionOfDay = MARKET_CONDITIONS[Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % MARKET_CONDITIONS.length];
  
  // Refresh state periodically
  useEffect(() => {
    const interval = setInterval(() => setState(getState()), 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider">
            {t('dashboard.welcome')} <span style={{ color: rank.color }}>{rank.nameEn}</span>
          </h1>
          <p className="font-mono text-xs text-[var(--inkDim)] mt-1">
            {t('common.app_motto')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-1.5">
            <Flame size={14} className="text-[var(--gold)]" />
            <span className="font-mono text-xs font-bold">{state.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-1.5">
            <Zap size={14} className="text-[var(--signal)]" />
            <span className="font-mono text-xs font-bold">{state.xp} XP</span>
          </div>
        </div>
      </motion.div>

      {/* ── XP PROGRESS BAR ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="panel p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">
            {rank.nameRu} → {rank.nameEn}
          </span>
          <span className="font-mono text-[10px] text-[var(--signal)]">
            {xpProgress.current}/{xpProgress.needed} XP
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress.percent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${rank.color}, ${C.signal})` }}
          />
        </div>
      </motion.div>

      {/* ── QUICK STATS GRID ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: t('common.rating'), value: rating, icon: <Trophy size={16} />, color: C.gold, format: (v: number) => v.toString() },
          { label: t('common.win_rate'), value: winRate, icon: <Target size={16} />, color: C.long, format: (v: number) => `${v}%` },
          { label: t('common.battles'), value: state.battles, icon: <Swords size={16} />, color: C.signal, format: (v: number) => v.toString() },
          { label: t('common.streak'), value: state.streak, icon: <Flame size={16} />, color: C.short, format: (v: number) => `${v}🔥` },
        ].map(({ label, value, icon, color, format }) => (
          <div key={label} className="panel p-4 text-center">
            <div className="flex items-center justify-center mb-2" style={{ color }}>{icon}</div>
            <p className="font-display text-xl font-black" style={{ color }}>{format(value)}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)] mt-1">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* ── ENTITY OF THE DAY ── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="panel p-5 border-2 cursor-pointer hover:scale-[1.01] transition-transform"
          style={{ borderColor: `${C.signal}44` }}
          onClick={() => setScreen('battle')}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[var(--signal)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">
              {t('dashboard.entity_of_day')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-5xl" style={{ filter: `drop-shadow(0 0 12px ${C.signal})` }}>
              {entityOfDay.glyph}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-black uppercase" style={{ color: C.signal }}>
                {entityOfDay.nameRu}
              </h3>
              <p className="font-mono text-[10px] text-[var(--inkDim)]">
                {entityOfDay.archetype} · {entityOfDay.discipline} · Threat: {entityOfDay.threatLevel}
              </p>
              <p className="mt-2 text-sm text-[var(--inkSoft)] line-clamp-2">
                {entityOfDay.description}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[10px] text-[var(--inkDim)]">
              {t('dashboard.entity_of_day_desc')}
            </span>
            <ArrowRight size={14} className="text-[var(--signal)]" />
          </div>
        </motion.div>

        {/* ── AI RECOMMENDATION ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel p-5 border-2"
          style={{ borderColor: `${C.grape}44` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-[var(--grape)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--grape)]">
              {t('dashboard.ai_recommendation')}
            </span>
          </div>
          <p className="text-sm text-[var(--inkSoft)] leading-relaxed">
            {aiRec.text}
          </p>
          {aiRec.entity && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--edge)] bg-black/20 p-3">
              <span className="text-2xl">{aiRec.entity.glyph}</span>
              <div>
                <p className="font-heading text-sm font-bold">{aiRec.entity.nameRu}</p>
                <p className="font-mono text-[10px] text-[var(--inkDim)]">
                  {aiRec.skill?.name}: {aiRec.value}%
                </p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setScreen('battle')}
            className="btn-primary w-full mt-4 py-2.5 text-sm"
          >
            {t('common.btn_start')} Training
          </button>
        </motion.div>

        {/* ── MARKET CONDITION ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="panel p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-[var(--gold)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--gold)]">
              {t('battle.market_condition')}
            </span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{conditionOfDay.glyph}</span>
            <div>
              <h3 className="font-display text-xl font-black" style={{ color: conditionOfDay.color }}>
                {conditionOfDay.name}
              </h3>
              <p className="font-mono text-[10px] text-[var(--inkDim)]">
                Modifier: {conditionOfDay.modifier}x
              </p>
            </div>
          </div>
          
          {/* Entity progress summary */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
              <p className="font-display text-lg font-bold text-[var(--long)]">{defeated}</p>
              <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.defeated')}</p>
            </div>
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
              <p className="font-display text-lg font-bold text-[var(--gold)]">{mastered}</p>
              <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.mastered')}</p>
            </div>
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
              <p className="font-display text-lg font-bold text-[var(--inkDim)]">{18 - defeated}</p>
              <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.undiscovered')}</p>
            </div>
          </div>
        </motion.div>

        {/* ── GLOBAL LEADERBOARD (server, block 1.5) ── */}
        <LeaderboardPanel myPlayerId={getState().id} />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-3">
          {t('dashboard.quick_actions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { screen: 'battle' as Screen, icon: <Swords size={20} />, label: t('common.menu_battle'), color: C.signal, desc: t('battle.daily_puzzle') },
            { screen: 'academy' as Screen, icon: <BookOpen size={20} />, label: t('common.menu_academy'), color: C.long, desc: t('academy.subtitle') },
            { screen: 'arena' as Screen, icon: <Trophy size={20} />, label: t('common.menu_arena'), color: C.gold, desc: t('arena.active_tournaments') },
            { screen: 'bestiary' as Screen, icon: <Award size={20} />, label: t('common.menu_bestiary'), color: C.grape, desc: '18 Entities' },
          ].map(({ screen, icon, label, color, desc }) => (
            <button
              key={screen}
              onClick={() => setScreen(screen)}
              className="panel p-4 text-left hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color }}>{icon}</span>
                <ChevronRight size={14} className="text-[var(--inkDim)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="font-heading text-sm font-bold">{label}</p>
              <p className="font-mono text-[10px] text-[var(--inkDim)] mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── SKILL RADAR MINI ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="panel p-5"
      >
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-4">
          {t('profile.skill_radar')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SKILLS.slice(0, 8).map(skill => (
            <div key={skill.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" 
                style={{ background: `${skill.color}15`, border: `1px solid ${skill.color}33` }}>
                {skill.glyph}
              </div>
              <div className="flex-1">
                <p className="font-mono text-[10px] text-[var(--inkSoft)]">{skill.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${state.skillValues[skill.id] || 0}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: skill.color }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{ color: skill.color }}>
                    {state.skillValues[skill.id] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── RECENT ACTIVITY ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="panel p-5"
      >
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-4">
          {t('dashboard.recent_battles')}
        </h2>
        {state.battles === 0 ? (
          <div className="text-center py-8">
            <Swords size={32} className="mx-auto text-[var(--inkDim)] mb-3" />
            <p className="text-sm text-[var(--inkSoft)]">{t('dashboard.no_battles')}</p>
            <button onClick={() => setScreen('battle')} className="btn-primary mt-4 px-6 py-2">
              {t('dashboard.go_to_arena')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--edge)] bg-black/20 p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{entityOfDay.glyph}</span>
                <div>
                  <p className="font-heading text-sm font-bold">{entityOfDay.nameRu}</p>
                  <p className="font-mono text-[10px] text-[var(--inkDim)]">Just now</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[var(--long)]">+15 XP</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── STREAK REWARD ── */}
      {state.streak >= 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="panel p-5 border-2"
          style={{ borderColor: `${C.gold}44` }}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-black text-[var(--gold)]">
                {state.streak} {t('dashboard.streak_days')}!
              </h3>
              <p className="text-sm text-[var(--inkSoft)]">
                {t('dashboard.streak_reward')}: +{state.streak * 5} $SIG
              </p>
            </div>
            <button className="btn-gold px-4 py-2 text-sm">
              {t('common.btn_claim')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
