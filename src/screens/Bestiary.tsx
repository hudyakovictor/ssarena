// ============================================================
// SIGNAL ARENA — BESTIARY SCREEN
// 18 Market Entities with full lore, stats, progression
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronDown, ChevronRight, Shield, Brain, 
  Target, Clock, Eye, Award, Lock, Star, AlertTriangle, X
} from 'lucide-react';
import { useT } from '../i18n';
import { useEntities } from '../hooks/useEntities';
import { 
  MARKET_ENTITIES, ARCHETYPES, C, THREAT_COLORS, DISCIPLINES, RARITY,
  getState, type MarketEntity, type ThreatLevel, type Discipline 
} from '../lib/gameState';

interface BestiaryProps {
  player: any;
}

type FilterType = 'all' | Discipline | ThreatLevel;

export function Bestiary({ player }: BestiaryProps) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEntity, setSelectedEntity] = useState<MarketEntity | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const state = getState();
  const { entities, fromServer } = useEntities(); // block 1.6: server content pack

  // Filter entities
  const filtered = entities.filter(entity => {
    const matchesSearch = search === '' || 
      entity.name.toLowerCase().includes(search.toLowerCase()) ||
      entity.nameRu.includes(search) ||
      entity.archetype.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      entity.discipline === filter || 
      entity.threatLevel === filter;
    
    return matchesSearch && matchesFilter;
  });
  
  // Stats
  const total = entities.length;
  const discovered = Object.values(state.entityHistory).filter(e => e.status !== 'undiscovered').length;
  const defeated = Object.values(state.entityHistory).filter(e => e.status === 'defeated' || e.status === 'mastered').length;
  const mastered = Object.values(state.entityHistory).filter(e => e.status === 'mastered').length;
  
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-black uppercase tracking-wider">
          {t('bestiary.title')}
        </h1>
        <p className="font-mono text-xs text-[var(--inkDim)] mt-1">
          {t('bestiary.subtitle')}
          {fromServer && <span className="ml-2 text-[var(--long)]">· live: content pack</span>}
        </p>
      </motion.div>

      {/* ── STATS BAR ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { label: 'Total', value: total, color: C.inkDim },
          { label: t('bestiary.encountered'), value: discovered, color: C.signal },
          { label: t('bestiary.defeated'), value: defeated, color: C.long },
          { label: t('bestiary.mastered'), value: mastered, color: C.gold },
        ].map(({ label, value, color }) => (
          <div key={label} className="panel p-3 text-center">
            <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── SEARCH & FILTER ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--inkDim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full rounded-xl border border-[var(--edge)] bg-black/30 px-10 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--signal)]/40 transition-colors"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 rounded-xl border border-[var(--edge)] bg-black/30 px-4 py-2.5 text-sm font-mono hover:border-[var(--signal)]/40 transition-colors"
          >
            <Filter size={14} />
            {filter === 'all' ? t('bestiary.filter_all') : filter}
            <ChevronDown size={12} />
          </button>
          
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--edge)] bg-[var(--void)] shadow-xl z-50"
              >
                <div className="p-2">
                  <button
                    onClick={() => { setFilter('all'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono ${filter === 'all' ? 'bg-[var(--signal)]/10 text-[var(--signal)]' : 'hover:bg-white/[0.02]'}`}
                  >
                    {t('bestiary.filter_all')}
                  </button>
                  <div className="border-t border-[var(--edge)] my-1" />
                  <p className="px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)]">
                    {t('bestiary.filter_discipline')}
                  </p>
                  {Object.entries(DISCIPLINES).map(([key, disc]) => (
                    <button
                      key={key}
                      onClick={() => { setFilter(key as FilterType); setShowFilterMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2 ${filter === key ? 'bg-[var(--signal)]/10' : 'hover:bg-white/[0.02]'}`}
                    >
                      <span>{disc.glyph}</span>
                      <span style={{ color: disc.color }}>{disc.nameEn}</span>
                    </button>
                  ))}
                  <div className="border-t border-[var(--edge)] my-1" />
                  <p className="px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--inkDim)]">
                    {t('bestiary.filter_threat')}
                  </p>
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as ThreatLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => { setFilter(level); setShowFilterMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2 ${filter === level ? 'bg-[var(--signal)]/10' : 'hover:bg-white/[0.02]'}`}
                    >
                      <AlertTriangle size={12} style={{ color: THREAT_COLORS[level] }} />
                      <span style={{ color: THREAT_COLORS[level] }}>{level}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── ENTITY GRID ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {filtered.map((entity, i) => {
          const record = state.entityHistory[entity.id];
          const archetype = ARCHETYPES.find(a => a.id === entity.archetype);
          const isUndiscovered = record?.status === 'undiscovered';
          
          return (
            <motion.div
              key={entity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedEntity(entity)}
              className={`panel p-4 cursor-pointer hover:scale-[1.02] transition-all ${
                isUndiscovered ? 'opacity-50' : ''
              }`}
              style={{ borderColor: `${THREAT_COLORS[entity.threatLevel]}22` }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="text-3xl flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ 
                    background: isUndiscovered 
                      ? 'rgba(255,255,255,0.03)' 
                      : `radial-gradient(circle at 50% 35%, ${archetype?.color || C.signal}33, transparent)`,
                    border: `1px solid ${isUndiscovered ? 'var(--edge)' : `${archetype?.color || C.signal}44`}`
                  }}
                >
                  {isUndiscovered ? <Lock size={18} className="text-[var(--inkDim)]" /> : entity.glyph}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-bold truncate">
                    {isUndiscovered ? '???' : entity.nameRu}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="pill text-[9px]" style={{ background: `${THREAT_COLORS[entity.threatLevel]}1a`, color: THREAT_COLORS[entity.threatLevel], border: `1px solid ${THREAT_COLORS[entity.threatLevel]}44` }}>
                      {entity.threatLevel}
                    </span>
                    <span className="pill text-[9px]" style={{ background: `${archetype?.color || C.signal}1a`, color: archetype?.color || C.signal, border: `1px solid ${archetype?.color || C.signal}44` }}>
                      {archetype?.glyph} {entity.archetype}
                    </span>
                  </div>
                  {!isUndiscovered && record && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-mono text-[10px] text-[var(--inkDim)]">
                        {record.encounters} {t('bestiary.encounters')}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--long)]">
                        {record.wins} {t('bestiary.victories')}
                      </span>
                      {record.encounters > 0 && (
                        <span className="font-mono text-[10px] text-[var(--gold)]">
                          {Math.round((record.wins / record.encounters) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-[var(--inkDim)]" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── ENTITY DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEntity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="panel max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <EntityDetail entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ENTITY DETAIL COMPONENT ──
function EntityDetail({ entity, onClose }: { entity: MarketEntity; onClose: () => void }) {
  const { t } = useT();
  const state = getState();
  const record = state.entityHistory[entity.id];
  const archetype = ARCHETYPES.find(a => a.id === entity.archetype);
  const disc = DISCIPLINES[entity.discipline];
  const [activeTab, setActiveTab] = useState<'overview' | 'lore' | 'psychology' | 'counters'>('overview');
  
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-5xl" style={{ filter: `drop-shadow(0 0 12px ${archetype?.color || C.signal})` }}>
            {entity.glyph}
          </div>
          <div>
            <h2 className="font-display text-xl font-black uppercase" style={{ color: archetype?.color }}>
              {entity.nameRu}
            </h2>
            <p className="font-mono text-[10px] text-[var(--inkDim)]">
              {entity.name} · {entity.archetype} · {entity.discipline}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="pill" style={{ background: `${THREAT_COLORS[entity.threatLevel]}1a`, color: THREAT_COLORS[entity.threatLevel], border: `1px solid ${THREAT_COLORS[entity.threatLevel]}44` }}>
                {t('bestiary.threat')}: {entity.threatLevel}
              </span>
              <span className="pill" style={{ background: `${disc.color}1a`, color: disc.color, border: `1px solid ${disc.color}44` }}>
                {disc.glyph} {disc.nameEn}
              </span>
              <span className="pill" style={{ background: `${C.short}1a`, color: C.short, border: `1px solid ${C.short}44` }}>
                {t('bestiary.corruption')}: {entity.corruption}%
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-2">
          <X size={16} />
        </button>
      </div>

      {/* Stats */}
      {record && record.status !== 'undiscovered' && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
            <p className="font-display text-lg font-bold text-[var(--signal)]">{record.encounters}</p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.encounters')}</p>
          </div>
          <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
            <p className="font-display text-lg font-bold text-[var(--long)]">{record.wins}</p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.victories')}</p>
          </div>
          <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
            <p className="font-display text-lg font-bold text-[var(--gold)]">
              {record.encounters > 0 ? Math.round((record.wins / record.encounters) * 100) : 0}%
            </p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.win_rate_entity')}</p>
          </div>
          <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-2 text-center">
            <p className="font-display text-lg font-bold text-[var(--inkDim)]">
              {record.bestTime ? `${record.bestTime}s` : '-'}
            </p>
            <p className="font-mono text-[9px] text-[var(--inkDim)]">{t('bestiary.best_time')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'lore' as const, label: t('bestiary.lore') },
          { id: 'psychology' as const, label: t('bestiary.psychology') },
          { id: 'counters' as const, label: t('bestiary.counters') },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === tab.id 
                ? 'bg-[var(--signal)]/10 border border-[var(--signal)]/40 text-[var(--signal)]' 
                : 'border border-[var(--edge)] text-[var(--inkDim)] hover:bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-[var(--inkSoft)] leading-relaxed">{entity.description}</p>
            
            {/* Axes */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-3">Difficulty Axes</p>
              <div className="space-y-2">
                {[
                  { label: 'Info Density', value: entity.axes.infoDensity },
                  { label: 'Time Pressure', value: entity.axes.timePressure },
                  { label: 'Emotional Intensity', value: entity.axes.emotionalIntensity },
                  { label: 'Trap Sophistication', value: entity.axes.trapSophistication },
                  { label: 'Consequence Weight', value: entity.axes.consequenceWeight },
                  { label: 'Uncertainty Level', value: entity.axes.uncertaintyLevel },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[var(--inkDim)] w-32">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: value > 70 ? C.short : value > 40 ? C.gold : C.long }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold" style={{ color: value > 70 ? C.short : value > 40 ? C.gold : C.long }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'lore' && (
          <motion.div key="lore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--signal)]">▸ LORE</p>
              <p className="mt-2 text-sm text-[var(--inkSoft)] leading-relaxed italic">
                "{entity.loreSnippet}"
              </p>
            </div>
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--gold)]">▸ REAL MARKET</p>
              <p className="mt-2 text-sm text-[var(--inkSoft)] leading-relaxed">
                {entity.realMarket}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'psychology' && (
          <motion.div key="psychology" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--short)]">▸ PSYCHOLOGY</p>
              <p className="mt-2 text-sm text-[var(--inkSoft)] leading-relaxed">
                {entity.psychology}
              </p>
            </div>
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Expected Mistakes</p>
              <div className="space-y-2">
                {entity.expectedMistakes.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--short)]/20 bg-[var(--short)]/5 px-3 py-2">
                    <span className="text-[var(--short)]">✗</span>
                    <span className="font-mono text-xs text-[var(--inkSoft)]">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'counters' && (
          <motion.div key="counters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Counter Cards</p>
              <div className="space-y-2">
                {entity.counterCards.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--long)]/20 bg-[var(--long)]/5 px-3 py-2">
                    <span className="text-[var(--long)]">✓</span>
                    <span className="font-mono text-xs text-[var(--inkSoft)]">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Weak Skills</p>
              <div className="flex flex-wrap gap-2">
                {entity.weakSkills.map((s, i) => (
                  <span key={i} className="pill" style={{ background: `${C.signal}1a`, color: C.signal, border: `1px solid ${C.signal}44` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)] mb-2">Key Data</p>
              <div className="flex flex-wrap gap-2">
                {entity.keyData.map((d, i) => (
                  <span key={i} className="pill" style={{ background: `${C.gold}1a`, color: C.gold, border: `1px solid ${C.gold}44` }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
