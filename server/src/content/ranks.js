// ============================================================
// RANKS — single source of truth (15 ranks, XP thresholds)
// KEEP IN SYNC with frontend src/lib/data.ts RANKS
// ============================================================

export const RANKS = [
  { id: 0,  nameRu: "Первый раз открыл график", nameEn: "First Chart Opened",  tier: "Initiate",    minXp: 0 },
  { id: 1,  nameRu: "Новичок свечей",           nameEn: "Candle Novice",       tier: "Initiate",    minXp: 200 },
  { id: 2,  nameRu: "Охотник за трендом",       nameEn: "Trend Hunter",        tier: "Apprentice",  minXp: 500 },
  { id: 3,  nameRu: "Ученик риск-менеджмента",  nameEn: "Risk Apprentice",     tier: "Apprentice",  minXp: 900 },
  { id: 4,  nameRu: "Читатель ликвидности",     nameEn: "Liquidity Reader",    tier: "Adept",       minXp: 1400 },
  { id: 5,  nameRu: "Анти-FOMO трейдер",        nameEn: "Anti-FOMO Trader",    tier: "Adept",       minXp: 2000 },
  { id: 6,  nameRu: "Аналитик новостей",        nameEn: "News Analyst",        tier: "Veteran",     minXp: 2700 },
  { id: 7,  nameRu: "On-chain разведчик",       nameEn: "On-chain Scout",      tier: "Veteran",     minXp: 3500 },
  { id: 8,  nameRu: "Макро-следопыт",           nameEn: "Macro Tracker",       tier: "Expert",      minXp: 4400 },
  { id: 9,  nameRu: "Турнирный стратег",        nameEn: "Tournament Strategist", tier: "Expert",   minXp: 5400 },
  { id: 10, nameRu: "Мастер вероятностей",      nameEn: "Probability Master",  tier: "Master",      minXp: 6500 },
  { id: 11, nameRu: "Рыночный тактик",          nameEn: "Market Tactician",    tier: "Master",      minXp: 7700 },
  { id: 12, nameRu: "Crypto Analyst",           nameEn: "Crypto Analyst",      tier: "Elite",       minXp: 9000 },
  { id: 13, nameRu: "Alpha Hunter",             nameEn: "Alpha Hunter",        tier: "Elite",       minXp: 10500 },
  { id: 14, nameRu: "Grandmaster of Signals",   nameEn: "Grandmaster of Signals", tier: "Grandmaster", minXp: 12500 },
];

// rank index by xp (block 2.2)
export function rankForXp(xp) {
  let idx = 0;
  for (const r of RANKS) {
    if (xp >= r.minXp) idx = r.id; else break;
  }
  return idx;
}

// progress between current and next rank: { current, next, pct, xpToNext }
export function rankProgress(xp) {
  const idx = rankForXp(xp);
  const cur = RANKS[idx];
  const nxt = RANKS[idx + 1] || null;
  if (!nxt) return { index: idx, name: cur.nameRu, nameEn: cur.nameEn, tier: cur.tier, pct: 100, xpToNext: 0 };
  const span = nxt.minXp - cur.minXp;
  const pct = Math.min(100, Math.round(((xp - cur.minXp) / span) * 100));
  return { index: idx, name: cur.nameRu, nameEn: cur.nameEn, tier: cur.tier, pct, xpToNext: nxt.minXp - xp };
}

// XP economy (block 2.1)
export const XP_RULES = {
  winBase: 0.5,     // xp = score * 0.5 * (1 + streakBonus)
  streakBonus: 0.1, // +10% per current streak (cap 5)
  lossConsolation: 15, // small xp for playing a battle and losing (learning)
  partialBonus: 25,
};
