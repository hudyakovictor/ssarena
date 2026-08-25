// ============================================================
// SIGNAL ARENA — MARKET SCREEN
// Premium, Season Pass, Cosmetics, Cards store
// ============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Crown, Palette, Zap, Star } from 'lucide-react';
import { useT } from '../i18n';
import { C, getState, activatePremium, isPremiumActive } from '../lib/gameState';

interface MarketProps {}

const STORE_ITEMS = [
  { id: 'season_pass', name: 'Season Pass', nameRu: 'Season Pass', price: 14.99, currency: 'USD', type: 'premium', glyph: '👑', color: C.gold, desc: 'Exclusive cards, +50% XP, tournament priority', discount: null },
  { id: 'starter_pack', name: 'Starter Pack', nameRu: 'Стартовый набор', price: 4.99, currency: 'USD', type: 'bundle', glyph: '🎁', color: C.long, desc: '5 cards + 500 $SIG + 7 days premium', discount: 40 },
  { id: 'avatar_fire', name: 'Fire Avatar', nameRu: 'Огненный аватар', price: 200, currency: '$SIG', type: 'cosmetic', glyph: '🔥', color: C.short, desc: 'Exclusive animated avatar', discount: null },
  { id: 'avatar_crystal', name: 'Crystal Avatar', nameRu: 'Кристальный аватар', price: 300, currency: '$SIG', type: 'cosmetic', glyph: '💎', color: C.signal, desc: 'Premium crystal avatar frame', discount: null },
  { id: 'xp_boost_7d', name: 'XP Boost 7d', nameRu: 'XP буст 7д', price: 150, currency: '$SIG', type: 'boost', glyph: '⚡', color: C.gold, desc: '+50% XP for 7 days', discount: null },
  { id: 'card_anti_fomo', name: 'Anti-FOMO Shield', nameRu: 'Anti-FOMO Shield', price: 100, currency: '$SIG', type: 'card', glyph: '🛡️', color: C.short, desc: 'Block impulsive decisions under pressure', discount: null },
];

export function Market() {
  const { t } = useT();
  const [state, setState] = useState(getState());
  const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'cosmetic' | 'boost' | 'card'>('all');
  const premiumActive = isPremiumActive();
  
  const filtered = STORE_ITEMS.filter(item => activeFilter === 'all' || item.type === activeFilter);
  
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-black uppercase tracking-wider">{t('market.title')}</h1>
        <p className="font-mono text-xs text-[var(--inkDim)] mt-1">{t('market.subtitle')}</p>
      </motion.div>
      
      {/* Balance */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-4">
        <div className="panel px-4 py-2 flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="font-mono text-sm font-bold text-[var(--gold)]">{state.sigBalance} $SIG</span>
        </div>
        {premiumActive && (
          <div className="panel px-4 py-2 flex items-center gap-2 border-2" style={{ borderColor: `${C.gold}44` }}>
            <Crown size={14} className="text-[var(--gold)]" />
            <span className="font-mono text-xs font-bold text-[var(--gold)]">Premium Active</span>
          </div>
        )}
      </motion.div>
      
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all' as const, label: 'All', icon: <ShoppingBag size={14} /> },
          { id: 'premium' as const, label: t('market.season_pass'), icon: <Crown size={14} /> },
          { id: 'cosmetic' as const, label: t('market.cosmetics'), icon: <Palette size={14} /> },
          { id: 'boost' as const, label: t('market.boosts'), icon: <Zap size={14} /> },
          { id: 'card' as const, label: t('market.cards'), icon: <Star size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono whitespace-nowrap transition-all ${
              activeFilter === tab.id 
                ? 'bg-[var(--signal)]/10 border border-[var(--signal)]/40 text-[var(--signal)]' 
                : 'border border-[var(--edge)] text-[var(--inkDim)] hover:bg-white/[0.02]'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Season Pass Banner */}
      {!premiumActive && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="panel p-6 border-2 cursor-pointer hover:scale-[1.01] transition-transform"
          style={{ borderColor: `${C.gold}44`, background: `linear-gradient(135deg, ${C.gold}08, ${C.signal}08)` }}
          onClick={() => { activatePremium(); setState(getState()); }}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">👑</span>
            <div className="flex-1">
              <h2 className="font-display text-xl font-black text-[var(--gold)]">{t('market.season_pass')}</h2>
              <p className="text-sm text-[var(--inkSoft)] mt-1">{t('market.season_pass_desc')}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-lg font-bold text-[var(--gold)]">$14.99</span>
                <span className="font-mono text-xs text-[var(--inkDim)]">/quarter</span>
              </div>
            </div>
            <button className="btn-gold px-6 py-3 text-sm font-bold">{t('market.purchase')}</button>
          </div>
        </motion.div>
      )}
      
      {/* Store Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="panel p-5 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${item.color})` }}>{item.glyph}</span>
              {item.discount && (
                <span className="pill text-[9px]" style={{ background: `${C.short}1a`, color: C.short, border: `1px solid ${C.short}44` }}>
                  -{item.discount}%
                </span>
              )}
            </div>
            <h3 className="font-heading text-sm font-bold">{item.nameRu}</h3>
            <p className="font-mono text-[10px] text-[var(--inkDim)] mt-1">{item.desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                {item.discount && (
                  <span className="font-mono text-[10px] text-[var(--inkDim)] line-through mr-2">
                    {item.currency === 'USD' ? `$${(item.price / (1 - item.discount/100)).toFixed(2)}` : `${Math.round(item.price / (1 - item.discount/100))} $SIG`}
                  </span>
                )}
                <span className="font-mono text-sm font-bold" style={{ color: item.color }}>
                  {item.currency === 'USD' ? `$${item.price}` : `${item.price} $SIG`}
                </span>
              </div>
              <button className="btn-primary px-4 py-1.5 text-xs">{t('market.purchase')}</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
