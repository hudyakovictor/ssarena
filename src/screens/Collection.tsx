// ============================================================
// SIGNAL ARENA — COLLECTION SCREEN
// Skill Cards with filters, deck builder, card details
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, ChevronDown, Star, Zap, Lock, X } from 'lucide-react';
import { useT } from '../i18n';
import { CARDS, C, RARITY, DISCIPLINES, getState, type SkillCard } from '../lib/gameState';

interface CollectionProps {
  player: any;
}

export function Collection({ player }: CollectionProps) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<SkillCard | null>(null);
  const state = getState();
  
  const filtered = CARDS.filter(card => 
    search === '' || 
    card.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    card.nameRu.includes(search)
  );
  
  const ownedCount = CARDS.filter(c => state.unlockedCards.includes(c.id)).length;
  
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-black uppercase tracking-wider">{t('collection.title')}</h1>
        <p className="font-mono text-xs text-[var(--inkDim)] mt-1">{t('collection.subtitle')} · {ownedCount}/{CARDS.length}</p>
      </motion.div>
      
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--inkDim)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full rounded-xl border border-[var(--edge)] bg-black/30 px-10 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--signal)]/40"
        />
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((card, i) => {
          const owned = state.unlockedCards.includes(card.id);
          const rarity = RARITY[card.rarity];
          const disc = DISCIPLINES[card.discipline];
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCard(card)}
              className={`panel p-4 cursor-pointer hover:scale-[1.02] transition-all ${!owned ? 'opacity-50' : ''}`}
              style={{ borderColor: `${rarity.color}22` }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{card.glyph}</span>
                {!owned && <Lock size={14} className="text-[var(--inkDim)]" />}
                {owned && (
                  <span className="pill text-[9px]" style={{ background: `${rarity.color}1a`, color: rarity.color, border: `1px solid ${rarity.color}44` }}>
                    {rarity.tag}
                  </span>
                )}
              </div>
              <h3 className="font-heading text-sm font-bold">{card.nameRu}</h3>
              <p className="font-mono text-[10px] text-[var(--inkDim)] mt-1">Tier {card.tier} · {disc.glyph} {disc.nameEn}</p>
              <p className="mt-2 text-xs text-[var(--inkSoft)] line-clamp-2">{card.effect}</p>
              <div className="mt-2 flex items-center gap-1">
                <Zap size={10} className="text-[var(--gold)]" />
                <span className="font-mono text-[10px] text-[var(--gold)]">{card.cost} AP</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      <AnimatePresence>
        {selectedCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="panel max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCard.glyph}</span>
                  <div>
                    <h2 className="font-display text-lg font-black">{selectedCard.nameRu}</h2>
                    <p className="font-mono text-[10px] text-[var(--inkDim)]">{selectedCard.nameEn}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCard(null)} className="btn-ghost p-2"><X size={16} /></button>
              </div>
              <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--signal)]">▸ EFFECT</p>
                <p className="mt-1 text-sm text-[var(--inkSoft)]">{selectedCard.effect}</p>
              </div>
              <div className="rounded-xl border border-[var(--edge)] bg-black/20 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--gold)]">▸ FLAVOR</p>
                <p className="mt-1 text-sm text-[var(--inkSoft)] italic">"{selectedCard.flavor}"</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
