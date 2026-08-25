// ============================================================
// SIGNAL ARENA — PROFILE SCREEN
// Stats, skill radar, achievements, entity progress, battle history
// ============================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Target, Flame, Swords, Shield, Brain, Award, 
  Clock, TrendingUp, Star, Share2, Check
} from 'lucide-react';
import { useT } from '../i18n';
import { 
  getState, getCurrentRank, getXpProgress, getWinRate, getMasteredEntities,
  getDefeatedEntities, getRating, MARKET_ENTITIES, SKILLS, C, ARCHETYPES
} from '../lib/gameState';

interface ProfileProps {
  player: any;
}

export function Profile({ player }: ProfileProps) {
  const { t } = useT();
  const [state, setState] = useState(getState());
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'achievements' | 'entities' | 'history'>('stats');
  const [copied, setCopied] = useState(false);
  
  const rank = getCurrentRank();
  const xpProgress = getXpProgress();
  const winRate = getWinRate();
  const mastered = getMasteredEntities();
  const _defeated = getDefeatedEntities();
  // Block 2.4: server ELO when the profile sync pulled it (offline — local formula)
  const rating = typeof player?.serverRating === "number" ? player.serverRating : getRating();
  
  useEffect(() => {
    const interval = setInterval(() => setState(getState()), 2000);
    return () => clearInterval(interval);
  }, []);
  
  const copyProfile = () => {
    const text = `⚔️ Signal Arena Profile\n` +
      `Rank: ${rank.nameEn}\n` +
      `Rating: ${rating}\n` +
      `Win Rate: ${winRate}%\n` +
      `Battles: ${state.battles} | Wins: ${state.wins}\n` +
      `Entities Mastered: ${mastered}/18\n` +
      `Streak: ${state.streak}🔥\n\n` +
      `#SignalArena #ProofOfSkill`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
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
            {t('profile.title')}
          </h1>
          <p className="font-mono text-xs text-[var(--inkDim)] mt-1">
            {t('profile.subtitle')}
          </p>
        </div>
        <button onClick={copyProfile} className="btn-ghost px-3 py-2 flex items-center gap-2">
          {copied ? <Check size={14} className="text-[var(--long)]" /> : <Share2 size={14} />}
          <span className="font-mono text-xs">{copied ? t('share.copied') : t('profile.share_profile')}</span>
        </button>
      </motion.div>

      {/* ── PLAYER CARD ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="panel p-6 border-2"
        style={{ borderColor: `${rank.color}44` }}
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-6xl" style={{ filter: `drop-shadow(0 0 16px ${rank.color})` }}>
            {state.avatar}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-black" style={{ color: rank.color }}>
              {rank.nameRu}
            </h2>
            <p className="font-mono text-xs text-[var(--inkDim)]">
              {rank.nameEn} · {rank.tier}
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Trophy size={14} className="text-[var(--gold)]" />
                <span className="font-mono text-sm font-bold text-[var(--gold)]">{rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-[var(--long)]" />
                <span className="font-mono text-sm font-bold text-[var(--long)]">{winRate}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Swords size={14} className="text-[var(--signal)]" />
                <span className="font-mono text-sm font-bold text-[var(--signal)]">{state.battles}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-[var(--short)]" />
                <span className="font-mono text-sm font-bold text-[var(--short)]">{state.streak}🔥</span>
              </div>
            </div>
            {/* XP Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-[var(--inkDim)]">
                  {xpProgress.current}/{xpProgress.needed} XP
                </span>
                <span className="font-mono text-[10px] text-[var(--signal)]">
                  {Math.round(xpProgress.percent)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.percent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${rank.color}, ${C.signal})` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'stats' as const, label: t('profile.stats'), icon: <TrendingUp size={14} /> },
          { id: 'skills' as const, label: t('profile.skills'), icon: <Brain size={14} /> },
          { id: 'achievements' as const, label: t('profile.achievements'), icon: <Award size={14} /> },
          { id: 'entities' as const, label: t('profile.entity_progress'), icon: <Shield size={14} /> },
          { id: 'history' as const, label: t('profile.history'), icon: <Clock size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono whitespace-nowrap transition-all ${
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
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t('common.rating'), value: rating, color: C.gold, icon: <Trophy size={16} /> },
                { label: t('common.win_rate'), value: `${winRate}%`, color: C.long, icon: <Target size={16} /> },
                { label: t('common.battles'), value: state.battles, color: C.signal, icon: <Swords size={16} /> },
                { label: t('common.wins'), value: state.wins, color: C.long, icon: <Star size={16} /> },
                { label: t('common.losses'), value: state.losses, color: C.short, icon: <Shield size={16} /> },
                { label: t('common.streak'), value: state.streak, color: C.short, icon: <Flame size={16} /> },
                { label: 'Best Streak', value: state.longestStreak, color: C.gold, icon: <TrendingUp size={16} /> },
                { label: t('common.sig_token'), value: state.sigBalance, color: C.signal, icon: <Award size={16} /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="panel p-4 text-center">
                  <div className="flex items-center justify-center mb-2" style={{ color }}>{icon}</div>
                  <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                  <p className="font-mono text-[9px] text-[var(--inkDim)] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {SKILLS.map((skill, i) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="panel p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" 
                    style={{ background: `${skill.color}15`, border: `1px solid ${skill.color}33` }}>
                    {skill.glyph}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm font-bold">{skill.name}</span>
                      <span className="font-mono text-sm font-bold" style={{ color: skill.color }}>
                        {state.skillValues[skill.id] || 0}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${state.skillValues[skill.id] || 0}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: skill.color }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`panel p-4 ${ach.unlocked ? 'border-2' : 'opacity-60'}`}
                style={ach.unlocked ? { borderColor: `${C.gold}44` } : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ach.glyph}</span>
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-bold">{ach.name}</h3>
                    <p className="font-mono text-[10px] text-[var(--inkDim)]">{ach.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${(ach.progress / ach.maxProgress) * 100}%`,
                            background: ach.unlocked ? C.gold : C.signal 
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[var(--inkDim)]">
                        {ach.progress}/{ach.maxProgress}
                      </span>
                    </div>
                  </div>
                  {ach.unlocked && (
                    <span className="text-lg">✅</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'entities' && (
          <motion.div key="entities" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {MARKET_ENTITIES.map((entity, i) => {
              const record = state.entityHistory[entity.id];
              const archetype = ARCHETYPES.find(a => a.id === entity.archetype);
              
              return (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="panel p-3 flex items-center gap-3"
                >
                  <span className="text-xl">{entity.glyph}</span>
                  <div className="flex-1">
                    <p className="font-heading text-sm font-bold">{entity.nameRu}</p>
                    <p className="font-mono text-[10px] text-[var(--inkDim)]">
                      {record.encounters} encounters · {record.wins} wins
                    </p>
                  </div>
                  <span className="pill text-[9px]" style={{ 
                    background: record.status === 'mastered' ? `${C.gold}1a` : record.status === 'defeated' ? `${C.long}1a` : record.status === 'encountered' ? `${C.signal}1a` : `${C.inkDim}1a`,
                    color: record.status === 'mastered' ? C.gold : record.status === 'defeated' ? C.long : record.status === 'encountered' ? C.signal : C.inkDim,
                    border: `1px solid ${record.status === 'mastered' ? C.gold : record.status === 'defeated' ? C.long : record.status === 'encountered' ? C.signal : C.inkDim}44`
                  }}>
                    {record.status}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {state.battles === 0 ? (
              <div className="text-center py-12">
                <Swords size={32} className="mx-auto text-[var(--inkDim)] mb-3" />
                <p className="text-sm text-[var(--inkSoft)]">{t('dashboard.no_battles')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="panel p-4 text-center">
                  <p className="font-mono text-sm text-[var(--inkSoft)]">
                    Battle history will appear here after your first battle.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
