// ============================================================
// SIGNAL ARENA — GLOBAL GAME STATE MANAGEMENT
// Single source of truth for all game data
// ============================================================
import { MARKET_ENTITIES, CARDS, RANKS, TOURNAMENTS, TICKER, SHARE_CARDS, ARCHETYPES, C, THREAT_COLORS, DISCIPLINES, RARITY } from './data';
import type { MarketEntity, SkillCard, Rarity, EntityStatus, Discipline, ThreatLevel } from './data';

// ── PERSISTENCE ──
const STORAGE_KEY = 'signal-arena-v2';

function loadState(): Partial<PlayerState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted */ }
  return {};
}

function saveState(state: PlayerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      xp: state.xp,
      rankIndex: state.rankIndex,
      streak: state.streak,
      battles: state.battles,
      wins: state.wins,
      entityHistory: state.entityHistory,
      unlockedCards: state.unlockedCards,
      badges: state.badges,
      skillValues: state.skillValues,
      attention: state.attention,
      disciplineShield: state.disciplineShield,
      sigBalance: state.sigBalance,
      seasonPass: state.seasonPass,
      tournamentHistory: state.tournamentHistory,
      achievements: state.achievements,
      referrals: state.referrals,
    }));
  } catch { /* quota exceeded */ }
}

// ── TYPES ──
export interface EntityRecord {
  status: EntityStatus;
  encounters: number;
  wins: number;
  lastEncounter: string | null;
  bestTime: number | null;
  currentLevel: number;
}

export interface BattleResult {
  id: string;
  entityId: string;
  entityName: string;
  mode: BattleMode;
  outcome: 'win' | 'loss' | 'draw';
  correctOption: string;
  playerOption: string;
  timeSpent: number;
  sourcesUsed: string[];
  xpGained: number;
  timestamp: number;
  roundNumber: number;
  marketCondition: string;
  twistEvent?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  glyph: string;
  rarity: Rarity;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
}

export interface TournamentResult {
  tournamentId: string;
  placement: number;
  totalPlayers: number;
  prize: number;
  timestamp: number;
}

export type BattleMode = 'daily' | 'training' | 'ghost' | 'live' | 'tournament';

export interface PlayerState {
  // Identity
  id: string;
  name: string;
  avatar: string;
  
  // Progression
  xp: number;
  rankIndex: number;
  streak: number;
  longestStreak: number;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  
  // Skills (0-100)
  skillValues: Record<string, number>;
  
  // Resources
  attention: number;
  maxAttention: number;
  disciplineShield: number;
  sigBalance: number;
  
  // Entity tracking
  entityHistory: Record<string, EntityRecord>;
  
  // Collection
  unlockedCards: string[];
  badges: Achievement[];
  
  // Social
  seasonPass: boolean;
  premiumExpiry: number | null;
  tournamentHistory: TournamentResult[];
  achievements: Achievement[];
  referrals: string[];
  
  // Server meta (block 2.4) — filled by usePlayerProfile sync
  serverRating?: number;
  lastProfileSync?: number;
  
  // UI state
  screen: string;
  sidebarOpen: boolean;
  theme: 'dark' | 'terminal' | 'midnight';
  language: 'ru' | 'en';
  soundEnabled: boolean;
  notifications: boolean;
}

// ── SKILL DEFINITIONS ──
export const SKILLS = [
  { id: 'chart', name: 'Chart Reading', color: '#22d3ee', glyph: '📊', max: 100 },
  { id: 'risk', name: 'Risk Management', color: '#2bd47f', glyph: '⚖️', max: 100 },
  { id: 'fomo', name: 'FOMO Resistance', color: '#fb4b6b', glyph: '🛡️', max: 100 },
  { id: 'timing', name: 'Timing', color: '#22d3ee', glyph: '⏱️', max: 100 },
  { id: 'discipline', name: 'Discipline', color: '#fb4b6b', glyph: '🧘', max: 100 },
  { id: 'onchain', name: 'On-chain Logic', color: '#8b5cf6', glyph: '🔗', max: 100 },
  { id: 'macro', name: 'Macro Awareness', color: '#4f8cff', glyph: '🌐', max: 100 },
  { id: 'liquidity', name: 'Liquidity Awareness', color: '#22d3ee', glyph: '🌊', max: 100 },
  { id: 'narrative', name: 'Narrative Detection', color: '#ec4899', glyph: '📖', max: 100 },
  { id: 'security', name: 'Contract Security', color: '#8b5cf6', glyph: '🛡️', max: 100 },
  { id: 'tokenomics', name: 'Tokenomics', color: '#fbbf24', glyph: '🪙', max: 100 },
  { id: 'governance', name: 'Governance', color: '#4f8cff', glyph: '🏛️', max: 100 },
];

// ── MARKET CONDITIONS ──
export const MARKET_CONDITIONS = [
  { id: 'stable', name: 'Stable', modifier: 0.7, glyph: '😴', color: '#2bd47f' },
  { id: 'volatile', name: 'Volatile', modifier: 1.0, glyph: '⚡', color: '#fbbf24' },
  { id: 'euphoric', name: 'Euphoric', modifier: 1.3, glyph: '🚀', color: '#2bd47f' },
  { id: 'fear', name: 'Fear', modifier: 1.6, glyph: '😨', color: '#fb4b6b' },
  { id: 'capitulation', name: 'Capitulation', modifier: 2.0, glyph: '💀', color: '#fb4b6b' },
  { id: 'manipulated', name: 'Manipulated', modifier: 2.5, glyph: '🕴️', color: '#8b5cf6' },
  { id: 'narrative_bubble', name: 'Narrative Bubble', modifier: 3.0, glyph: '🧜', color: '#ec4899' },
  { id: 'black_swan', name: 'Black Swan', modifier: 5.0, glyph: '🦢', color: '#fb4b6b' },
];

// ── ACHIEVEMENT DEFINITIONS ──
export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Win your first battle', glyph: '⚔️', rarity: 'common', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'fomo_slayer', name: 'FOMO Slayer', description: 'Defeat FOMO Wraith 10 times', glyph: '💀', rarity: 'rare', unlocked: false, progress: 0, maxProgress: 10 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', glyph: '🔥', rarity: 'rare', unlocked: false, progress: 0, maxProgress: 7 },
  { id: 'entity_master', name: 'Entity Master', description: 'Master 5 different entities', glyph: '👑', rarity: 'epic', unlocked: false, progress: 0, maxProgress: 5 },
  { id: 'perfect_battle', name: 'Perfect Battle', description: 'Win without opening any data source', glyph: '💎', rarity: 'legendary', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'whale_hunter', name: 'Whale Hunter', description: 'Defeat Whale Syndicate 5 times', glyph: '🐋', rarity: 'epic', unlocked: false, progress: 0, maxProgress: 5 },
  { id: 'black_swan_survivor', name: 'Black Swan Survivor', description: 'Survive a Black Swan market event', glyph: '🦢', rarity: 'mythic', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'hundred_wins', name: 'Century', description: 'Win 100 battles', glyph: '💯', rarity: 'legendary', unlocked: false, progress: 0, maxProgress: 100 },
  { id: 'vitalik_mode', name: 'Vitalik Mode', description: 'Reach Grandmaster rank', glyph: '👑', rarity: 'mythic', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'on_chain_oracle', name: 'On-chain Oracle', description: 'Master all on-chain entities', glyph: '🔮', rarity: 'legendary', unlocked: false, progress: 0, maxProgress: 6 },
];

// ── DEFAULT PLAYER STATE ──
function getDefaultState(): PlayerState {
  const saved = loadState();
  const entityHistory: Record<string, EntityRecord> = {};
  
  // Initialize all entities
  MARKET_ENTITIES.forEach(e => {
    entityHistory[e.id] = saved.entityHistory?.[e.id] || {
      status: 'undiscovered' as EntityStatus,
      encounters: 0,
      wins: 0,
      lastEncounter: null,
      bestTime: null,
      currentLevel: 1,
    };
  });

  return {
    id: saved.id || `player_${Date.now()}`,
    name: saved.name || 'Anonymous Trader',
    avatar: saved.avatar || '🎯',
    
    xp: saved.xp ?? 0,
    rankIndex: saved.rankIndex ?? 0,
    streak: saved.streak ?? 0,
    longestStreak: saved.longestStreak ?? 0,
    battles: saved.battles ?? 0,
    wins: saved.wins ?? 0,
    losses: saved.losses ?? 0,
    draws: saved.draws ?? 0,
    
    skillValues: saved.skillValues || Object.fromEntries(SKILLS.map(s => [s.id, 10])),
    
    attention: saved.attention ?? 8,
    maxAttention: saved.maxAttention ?? 8,
    disciplineShield: saved.disciplineShield ?? 50,
    sigBalance: saved.sigBalance ?? 100,
    
    entityHistory,
    unlockedCards: saved.unlockedCards || ['trend-check', 'support-resistance', 'volume-confirm', 'candle-pattern', 'risk-reward', 'stop-discipline', 'dont-chase'],
    badges: saved.badges || ACHIEVEMENT_DEFS,
    
    seasonPass: saved.seasonPass ?? false,
    premiumExpiry: saved.premiumExpiry ?? null,
    tournamentHistory: saved.tournamentHistory || [],
    achievements: saved.achievements || ACHIEVEMENT_DEFS,
    referrals: saved.referrals || [],
    
    screen: 'home',
    sidebarOpen: false,
    theme: 'dark',
    language: 'ru',
    soundEnabled: true,
    notifications: true,
  };
}

// ── GAME STATE SINGLETON ──
let _state: PlayerState = getDefaultState();
let _listeners: Set<() => void> = new Set();

export function getState(): PlayerState {
  return _state;
}

export function setState(partial: Partial<PlayerState>) {
  _state = { ..._state, ...partial };
  saveState(_state);
  _listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── DERIVED VALUES ──
export function getCurrentRank() {
  return RANKS[_state.rankIndex] || RANKS[0];
}

export function getNextRank() {
  return RANKS[_state.rankIndex + 1] || null;
}

export function getXpProgress(): { current: number; needed: number; percent: number } {
  const current = _state.xp;
  const next = getNextRank();
  const prev = getCurrentRank();
  if (!next) return { current, needed: current, percent: 100 };
  const needed = next.minXp - prev.minXp;
  const progress = current - prev.minXp;
  return { current: progress, needed, percent: Math.min(100, (progress / needed) * 100) };
}

export function getWinRate(): number {
  if (_state.battles === 0) return 0;
  return Math.round((_state.wins / _state.battles) * 100);
}

export function getMasteredEntities(): number {
  return Object.values(_state.entityHistory).filter(e => e.status === 'mastered').length;
}

export function getDefeatedEntities(): number {
  return Object.values(_state.entityHistory).filter(e => e.status === 'defeated' || e.status === 'mastered').length;
}

export function getRating(): number {
  // ELO-like rating
  const base = 1000;
  const xpBonus = Math.floor(_state.xp / 10);
  const winBonus = _state.wins * 15;
  const lossPenalty = _state.losses * 10;
  const streakBonus = Math.min(_state.streak * 5, 100);
  return base + xpBonus + winBonus - lossPenalty + streakBonus;
}

// ── XP CALCULATION ──
export function calculateXp(entity: MarketEntity, isCorrect: boolean, timeSpent: number, sourcesUsed: number, condition: { modifier: number }): number {
  if (!isCorrect) return 5; // consolation XP
  
  const base = Math.round(entity.corruption * 1.5);
  const timeBonus = Math.max(0, 30 - timeSpent); // faster = more XP
  const sourcePenalty = sourcesUsed * 2; // fewer sources = more skill
  const conditionBonus = Math.round(base * (condition.modifier - 1));
  
  return Math.max(10, base + timeBonus - sourcePenalty + conditionBonus);
}

// ── SKILL UPDATE ──
export function updateSkills(entity: MarketEntity, isCorrect: boolean) {
  const delta = isCorrect ? 3 : -1;
  const newSkills = { ..._state.skillValues };
  
  // Update primary discipline skill
  const disciplineMap: Record<Discipline, string[]> = {
    ta: ['chart', 'timing'],
    derivatives: ['risk', 'liquidity'],
    fundamental: ['macro', 'onchain'],
    psychology: ['fomo', 'discipline'],
    security: ['security', 'tokenomics'],
  };
  
  const affectedSkills = disciplineMap[entity.discipline] || [];
  affectedSkills.forEach(skillId => {
    if (newSkills[skillId] !== undefined) {
      newSkills[skillId] = Math.max(0, Math.min(100, newSkills[skillId] + delta));
    }
  });
  
  setState({ skillValues: newSkills });
}

// ── ENTITY ENCOUNTER ──
export function recordEntityEncounter(entityId: string, won: boolean, timeSpent?: number) {
  const history = { ..._state.entityHistory };
  const record = history[entityId] || {
    status: 'undiscovered' as EntityStatus,
    encounters: 0,
    wins: 0,
    lastEncounter: null,
    bestTime: null,
    currentLevel: 1,
  };
  
  record.encounters++;
  if (won) record.wins++;
  record.lastEncounter = new Date().toISOString();
  if (timeSpent && (!record.bestTime || timeSpent < record.bestTime)) {
    record.bestTime = timeSpent;
  }
  
  // Update status
  if (record.status === 'undiscovered') record.status = 'encountered';
  if (record.wins >= 3 && record.status === 'encountered') record.status = 'defeated';
  if (record.wins >= 7 && record.status === 'defeated') record.status = 'mastered';
  
  // Level up entity on defeats
  if (won && record.encounters % 3 === 0) {
    record.currentLevel = Math.min(99, record.currentLevel + 1);
  }
  
  history[entityId] = record;
  setState({ entityHistory: history });
}

// ── BATTLE RESULT ──
export function recordBattle(result: BattleResult) {
  const isWin = result.outcome === 'win';
  const isDraw = result.outcome === 'draw';
  
  setState({
    battles: _state.battles + 1,
    wins: _state.wins + (isWin ? 1 : 0),
    losses: _state.losses + (!isWin && !isDraw ? 1 : 0),
    draws: _state.draws + (isDraw ? 1 : 0),
    xp: _state.xp + result.xpGained,
    sigBalance: _state.sigBalance + (isWin ? 10 : 2),
    streak: isWin ? _state.streak + 1 : 0,
    longestStreak: isWin ? Math.max(_state.longestStreak, _state.streak + 1) : _state.longestStreak,
    attention: Math.min(_state.maxAttention, _state.attention + (isWin ? 1 : 0)),
    disciplineShield: Math.max(0, Math.min(100, _state.disciplineShield + (isWin ? 5 : -3))),
  });
  
  // Update rank
  const newRank = RANKS.findIndex((r, i) => i === RANKS.length - 1 || RANKS[i + 1].minXp > _state.xp);
  if (newRank > _state.rankIndex) {
    setState({ rankIndex: newRank });
  }
  
  // Check achievements
  checkAchievements();
}

// ── ACHIEVEMENT CHECK ──
function checkAchievements() {
  const achievements = [..._state.achievements];
  let changed = false;
  
  achievements.forEach(a => {
    if (a.unlocked) return;
    
    let progress = 0;
    switch (a.id) {
      case 'first_blood': progress = _state.wins > 0 ? 1 : 0; break;
      case 'fomo_slayer': progress = _state.entityHistory['fomo-wraith']?.wins || 0; break;
      case 'streak_7': progress = Math.max(_state.streak, _state.longestStreak); break;
      case 'entity_master': progress = getMasteredEntities(); break;
      case 'hundred_wins': progress = _state.wins; break;
      case 'whale_hunter': progress = _state.entityHistory['whale-syndicate']?.wins || 0; break;
      case 'vitalik_mode': progress = _state.rankIndex >= 14 ? 1 : 0; break;
    }
    
    if (progress > a.progress) {
      a.progress = Math.min(progress, a.maxProgress);
      changed = true;
    }
    if (a.progress >= a.maxProgress && !a.unlocked) {
      a.unlocked = true;
      a.unlockedAt = Date.now();
      changed = true;
    }
  });
  
  if (changed) setState({ achievements });
}

// ── CARD UNLOCK ──
export function unlockCard(cardId: string) {
  if (!_state.unlockedCards.includes(cardId)) {
    setState({ unlockedCards: [..._state.unlockedCards, cardId] });
  }
}

// ── PREMIUM ──
export function activatePremium(durationDays: number = 30) {
  const expiry = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  setState({ seasonPass: true, premiumExpiry: expiry });
}

export function isPremiumActive(): boolean {
  if (!_state.seasonPass) return false;
  if (_state.premiumExpiry && _state.premiumExpiry < Date.now()) {
    setState({ seasonPass: false, premiumExpiry: null });
    return false;
  }
  return true;
}

// ── SHARE CARD GENERATOR ──
export function generateShareCard(entityId: string, outcome: 'win' | 'loss'): string {
  const entity = MARKET_ENTITIES.find(e => e.id === entityId);
  if (!entity) return '';
  
  const record = _state.entityHistory[entityId];
  const rank = getCurrentRank();
  
  if (outcome === 'win') {
    return `⚔️ ${entity.nameRu} NEUTRALIZED!\n` +
      `Rank: ${rank.nameEn} | Win Rate: ${getWinRate()}%\n` +
      `Streak: ${_state.streak}🔥 | Entities Mastered: ${getMasteredEntities()}\n` +
      `\n"I didn't become the liquidity."\n` +
      `#SignalArena #ProofOfSkill #GameFi`;
  }
  return `${entity.glyph} ${entity.nameRu} defeated me.\n` +
    `But I learned something. That's the point.\n` +
    `Rank: ${rank.nameEn} | Next attempt loading...\n` +
    `#SignalArena #ProofOfSkill`;
}

// ── RESET (for testing) ──
export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  _state = getDefaultState();
  _listeners.forEach(fn => fn());
}

// ── EXPORTS ──
export { MARKET_ENTITIES, CARDS, RANKS, TOURNAMENTS, TICKER, SHARE_CARDS, ARCHETYPES, C, THREAT_COLORS, DISCIPLINES, RARITY };
export type { MarketEntity, SkillCard, Rarity, EntityStatus, Discipline, ThreatLevel };
