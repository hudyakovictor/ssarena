// ============================================================
// SIGNAL ARENA — REAL BATTLE ENGINE (Server-side)
// Deterministic battle logic, scenario resolution, XP calculation
// ============================================================
import { v4 as uuid } from 'uuid';

// ── BATTLE STATE MACHINE ──
// idle → prebattle → battle → twist(30% chance) → result

export interface BattleScenario {
  id: string;
  entityId: string;
  entityName: string;
  entityNameRu: string;
  archetype: string;
  discipline: string;
  threatLevel: string;
  corruption: number;
  glyph: string;
  level: number;
  asset: string;
  briefing: string;
  options: ScenarioOption[];
  dataSources: Record<string, DataSourceFact>;
  correctOptionId: string;
  difficultyAxes: DifficultyAxes;
  marketCondition: MarketCondition;
  twistEvent: TwistEvent | null;
  timeLimit: number; // seconds
  apBudget: number; // attention points
}

export interface ScenarioOption {
  id: string;
  label: string;
  correct: boolean;
  layer1: string; // factual (2-5 words)
  layer2: string; // terminal voice (5-12 words, dry wit)
  layer3: string; // professional explanation (2-4 sentences)
  errors: string[];
  skillDeltas: Record<string, number>;
}

export interface DataSourceFact {
  sourceId: string;
  name: string;
  cost: number;
  revealed: boolean;
  fact: string; // the actual data shown
  isRelevant: boolean; // does this source contain useful info?
  misdirection?: string; // misleading data (for harder levels)
}

export interface DifficultyAxes {
  infoDensity: number;
  timePressure: number;
  emotionalIntensity: number;
  trapSophistication: number;
  consequenceWeight: number;
  uncertaintyLevel: number;
}

export interface MarketCondition {
  id: string;
  name: string;
  modifier: number;
}

export interface TwistEvent {
  id: string;
  text: string;
  icon: string;
  effect: 'extend_time' | 'add_source' | 'remove_source' | 'change_correct' | 'double_stakes';
  effectValue: number;
}

export interface BattleState {
  battleId: string;
  playerId: string;
  scenario: BattleScenario;
  phase: 'idle' | 'prebattle' | 'battle' | 'twist' | 'result';
  timeStarted: number;
  timeLeft: number;
  apRemaining: number;
  openedSources: string[];
  playerOptionId: string | null;
  resolved: boolean;
  result: BattleResult | null;
}

export interface BattleResult {
  battleId: string;
  playerId: string;
  entityId: string;
  entityName: string;
  mode: string;
  outcome: 'win' | 'loss' | 'draw';
  correctOptionId: string;
  playerOptionId: string;
  timeSpent: number;
  sourcesUsed: string[];
  xpGained: number;
  sigGained: number;
  skillDeltas: Record<string, number>;
  newStreak: number;
  levelUp: boolean;
  rankUp: boolean;
  newAchievements: string[];
  timestamp: number;
  marketCondition: string;
  twistEvent: string | null;
  entityLevel: number;
  analysis: {
    layer1: string;
    layer2: string;
    layer3: string;
    icon: string;
  };
}

// ── MARKET CONDITIONS ──
const MARKET_CONDITIONS: MarketCondition[] = [
  { id: 'stable', name: 'Stable', modifier: 0.7 },
  { id: 'volatile', name: 'Volatile', modifier: 1.0 },
  { id: 'euphoric', name: 'Euphoric', modifier: 1.3 },
  { id: 'fear', name: 'Fear', modifier: 1.6 },
  { id: 'capitulation', name: 'Capitulation', modifier: 2.0 },
  { id: 'manipulated', name: 'Manipulated', modifier: 2.5 },
  { id: 'narrative_bubble', name: 'Narrative Bubble', modifier: 3.0 },
  { id: 'black_swan', name: 'Black Swan', modifier: 5.0 },
];

// ── TWIST EVENTS ──
const TWIST_EVENTS: TwistEvent[] = [
  { id: 'flash_crash', text: '⚡ FLASH CRASH: -12% in 3 minutes! Extra time granted.', icon: '⚡', effect: 'extend_time', effectValue: 15 },
  { id: 'whale_alert', text: '🐋 WHALE ALERT: $50M moved to exchange. New data source available.', icon: '🐋', effect: 'add_source', effectValue: 1 },
  { id: 'fud_news', text: '📰 BREAKING: Regulatory FUD. Social sentiment data corrupted.', icon: '📰', effect: 'remove_source', effectValue: 1 },
  { id: 'funding_flip', text: '🌡️ FUNDING FLIP: Rate went negative. Correct answer may have changed.', icon: '🌡️', effect: 'change_correct', effectValue: 0 },
  { id: 'liquidation_cascade', text: '💥 LIQUIDATION CASCADE: $200M liquidated. Double stakes.', icon: '💥', effect: 'double_stakes', effectValue: 2 },
  { id: 'vitalik_tweet', text: '🐦 VITALIK TWEETED: Market in chaos. Extra data source unlocked.', icon: '🐦', effect: 'add_source', effectValue: 1 },
  { id: 'sec_announcement', text: '⚖️ SEC ANNOUNCEMENT: Uncertainty peaks. Time extended.', icon: '⚖️', effect: 'extend_time', effectValue: 20 },
  { id: 'exchange_hack', text: '🔓 EXCHANGE HACK REPORTED: Security scan data critical.', icon: '🔓', effect: 'add_source', effectValue: 1 },
];

// ── ENTITY TEMPLATES (18 entities × multiple scenario variants) ──
const ENTITY_SCENARIO_TEMPLATES: Record<string, any> = {
  'fomo-wraith': {
    name: 'FOMO Wraith', nameRu: 'Wraith Упущенной Выгоды',
    archetype: 'wraith', discipline: 'psychology', threatLevel: 'HIGH',
    corruption: 82, glyph: '💀',
    briefingTemplates: [
      'ETH pumps +18% in 4 hours. Twitter is euphoric. Your finger hovers over BUY.',
      'Your altcoin watchlist is all green. Social sentiment at 94% bullish. FOMO intensifies.',
      'A new token just did 50x in 2 hours. Everyone in your Discord is aping in.',
    ],
    correctBehavior: 'wait_and_analyze',
    wrongBehaviors: ['fomo_entry', 'late_entry', 'herd_following'],
    sourceFacts: {
      chart: ['Price is parabolic. No pullback in 6 hours. RSI: 88 (extremely overbought).', 'Green candles accelerating. Each one bigger than the last. Classic blow-off top forming.'],
      volume: ['Volume peaked 2 hours ago and is declining while price rises. Divergence.', 'Volume is 340% above average. But 60% is from 3 wallets. Artificial.'],
      funding: ['Funding rate: +0.12%. Longs paying longs. Historically precedes -15% correction.', 'Funding rate at yearly high. Every time this happened, a -20% drop followed within 48h.'],
      sentiment: ['Social sentiment: 94% bullish. Historical extreme. Last time: -35% correction.', 'Twitter mentions up 800%. This is the peak of attention, not the peak of value.'],
      onchain: ['Whale wallets selling into the pump. Smart money distributing.', 'Exchange inflows up 340%. Large holders moving to sell.'],
    },
    correctOptions: [
      { id: 'A', label: 'Wait for pullback. Do not chase. RSI overbought + volume divergence.', errors: [], skillDeltas: { fomo: 5, discipline: 3, timing: 2 } },
      { id: 'B', label: 'Buy now, the momentum is strong', errors: ['fomo_entry'], skillDeltas: { fomo: -3, discipline: -2 } },
      { id: 'C', label: 'Buy with 10x leverage to maximize gains', errors: ['fomo_entry', 'overleverage'], skillDeltas: { fomo: -5, risk: -3, discipline: -4 } },
      { id: 'D', label: 'Sell everything else and go all-in on this', errors: ['fomo_entry', 'herd_following', 'oversized_risk'], skillDeltas: { fomo: -5, risk: -5, discipline: -5 } },
    ],
  },
  'fake-breakout-phantom': {
    name: 'Fake Breakout Phantom', nameRu: 'Фантом Ложного Пробоя',
    archetype: 'phantom', discipline: 'ta', threatLevel: 'HIGH',
    corruption: 78, glyph: '👻',
    briefingTemplates: [
      'BTC breaks $70K resistance with volume. Classic breakout setup. You enter long.',
      'ETH breaks above descending trendline. Volume spike confirms. Ready to enter.',
    ],
    correctBehavior: 'confirm_breakout',
    wrongBehaviors: ['fake_breakout_entry', 'ignored_volume', 'single_timeframe'],
    sourceFacts: {
      chart: ['Breakout looks clean on 1H. But daily shows it is the 4th attempt — weakening.', 'Price broke resistance but closed below it on the 4H candle. Failed breakout.'],
      volume: ['Volume on breakout is 40% LOWER than previous attempt. Weak conviction.', 'Volume spike is from 2 large market orders, not organic buying.'],
      funding: ['Funding rate neutral. No directional bias from derivatives.'],
      onchain: ['Whale wallets not participating. No large buys on-chain.', 'Exchange reserves flat. No accumulation signal.'],
    },
    correctOptions: [
      { id: 'A', label: 'Wait for retest of breakout level with volume confirmation', errors: [], skillDeltas: { chart: 5, timing: 3, discipline: 2 } },
      { id: 'B', label: 'Enter long immediately, breakout confirmed', errors: ['fake_breakout_entry'], skillDeltas: { chart: -3, timing: -2 } },
      { id: 'C', label: 'Enter with stop just below resistance', errors: ['single_timeframe'], skillDeltas: { chart: -1, risk: -1 } },
      { id: 'D', label: 'Enter with 20x leverage, this is the big breakout', errors: ['fake_breakout_entry', 'overleverage'], skillDeltas: { chart: -5, risk: -5 } },
    ],
  },
  'leverage-goblin': {
    name: 'Leverage Goblin', nameRu: 'Гоблин Плеча',
    archetype: 'goblin', discipline: 'derivatives', threatLevel: 'HIGH',
    corruption: 80, glyph: '👺',
    briefingTemplates: [
      'Perfect setup: bullish divergence on RSI, support holding, trend intact. 25x leverage?',
      'You have won 7 trades in a row. Confidence is high. This next one is 100% certain.',
    ],
    correctBehavior: 'moderate_leverage',
    wrongBehaviors: ['overleverage', 'oversized_risk', 'no_stop_loss'],
    sourceFacts: {
      chart: ['Setup looks clean. But ATR shows average daily range is 4.2%. At 25x, liquidation is at -4%.'],
      funding: ['Funding rate: +0.05%. Not extreme, but building.'],
      oi: ['Open interest at yearly high. Liquidation cascade risk elevated.'],
    },
    correctOptions: [
      { id: 'A', label: 'Use 3-5x leverage with tight stop-loss below structure', errors: [], skillDeltas: { risk: 5, discipline: 3, liquidity: 2 } },
      { id: 'B', label: 'Use 10x, the setup is strong', errors: ['overleverage'], skillDeltas: { risk: -2, discipline: -1 } },
      { id: 'C', label: 'Use 25x, maximize this sure thing', errors: ['overleverage', 'oversized_risk'], skillDeltas: { risk: -5, discipline: -3 } },
      { id: 'D', label: 'Use 50x with no stop, it will definitely go up', errors: ['overleverage', 'no_stop_loss'], skillDeltas: { risk: -5, discipline: -5, liquidity: -3 } },
    ],
  },
  'liquidity-hydra': {
    name: 'Liquidity Hydra', nameRu: 'Гидра Ликвидности',
    archetype: 'hydra', discipline: 'derivatives', threatLevel: 'HIGH',
    corruption: 76, glyph: '🐍',
    briefingTemplates: [
      'Your stop at -2% just got hit. Price immediately reversed +5%. Frustrating.',
      'Price approaching your stop-loss for the third time. Each time you widened it.',
    ],
    correctBehavior: 'accept_loss',
    wrongBehaviors: ['stop_widening', 'revenge_trade', 'correlated_exposure'],
    sourceFacts: {
      chart: ['Price is range-bound. Your stop is in the liquidity pool where everyone puts stops.', 'Stop-hunt pattern: wick below support, immediate recovery. Classic liquidity grab.'],
      volume: ['Volume spike at your stop level. That was the liquidity the market needed.'],
      onchain: ['Large buy wall appeared 0.5% below where stops were clustered. Whale collected.'],
    },
    correctOptions: [
      { id: 'A', label: 'Accept the loss. Review stop placement. Move on.', errors: [], skillDeltas: { discipline: 5, risk: 3, liquidity: 2 } },
      { id: 'B', label: 'Re-enter immediately to recover the loss', errors: ['revenge_trade'], skillDeltas: { discipline: -3, fomo: -2 } },
      { id: 'C', label: 'Widen stop and re-enter with larger size', errors: ['stop_widening', 'oversized_risk'], skillDeltas: { risk: -4, discipline: -3 } },
      { id: 'D', label: 'Double down, the original thesis was right', errors: ['stop_widening', 'revenge_trade'], skillDeltas: { risk: -5, discipline: -5 } },
    ],
  },
  'honeypot-mimic': {
    name: 'Honeypot Mimic', nameRu: 'Мимик Honeypot',
    archetype: 'mimic', discipline: 'security', threatLevel: 'CRITICAL',
    corruption: 95, glyph: '🎭',
    briefingTemplates: [
      'New token on DEX: only green candles. 10x in 3 days. Contract verified on explorer.',
      'DeFi protocol offering 500% APY. Audited by CertiK. TVL growing fast.',
    ],
    correctBehavior: 'verify_exit',
    wrongBehaviors: ['honeypot_blindness', 'proxy_blindness', 'fake_audit_trust'],
    sourceFacts: {
      security: ['Honeypot test: BUY succeeds. SELL simulation reverts. Sell tax: 99%.', 'Contract has hidden setTax() function. Owner can change tax to 100% at any time.'],
      holders: ['Top 10 wallets hold 94% of supply. All created 3 days ago.', 'Holder count: 847. But 840 have < $10. Bot wallets.'],
      chart: ['Chart shows only up. No natural pullbacks. Artificial price support.'],
    },
    correctOptions: [
      { id: 'A', label: 'Run honeypot test. Do NOT buy until sell is confirmed working.', errors: [], skillDeltas: { security: 5, discipline: 3, tokenomics: 2 } },
      { id: 'B', label: 'Buy small amount, looks legit with audit', errors: ['fake_audit_trust'], skillDeltas: { security: -3, discipline: -2 } },
      { id: 'C', label: 'Ape in, the chart is incredible', errors: ['honeypot_blindness'], skillDeltas: { security: -5, fomo: -3 } },
      { id: 'D', label: 'All-in with life savings, this is the next 1000x', errors: ['honeypot_blindness', 'oversized_risk'], skillDeltas: { security: -5, risk: -5, discipline: -5 } },
    ],
  },
};

// ── BATTLE ENGINE CLASS ──
export class BattleEngine {
  private battles: Map<string, BattleState> = new Map();
  private playerStates: Map<string, PlayerBattleData> = new Map();

  // ── CREATE NEW BATTLE ──
  createBattle(playerId: string, mode: string, rankIndex: number): BattleState {
    const entityIds = Object.keys(ENTITY_SCENARIO_TEMPLATES);
    const entityId = entityIds[Math.floor(Math.random() * entityIds.length)];
    const template = ENTITY_SCENARIO_TEMPLATES[entityId];
    
    if (!template) {
      throw new Error(`Unknown entity: ${entityId}`);
    }

    // Select random briefing
    const briefing = template.briefingTemplates[
      Math.floor(Math.random() * template.briefingTemplates.length)
    ];

    // Select random market condition (weighted by rank)
    const conditionIndex = Math.min(
      MARKET_CONDITIONS.length - 1,
      Math.floor(rankIndex / 2) + (Math.random() > 0.7 ? 1 : 0)
    );
    const condition = MARKET_CONDITIONS[conditionIndex];

    // Generate data sources with facts
    const dataSources: Record<string, DataSourceFact> = {};
    const sourceKeys = Object.keys(template.sourceFacts);
    sourceKeys.forEach(key => {
      const facts = template.sourceFacts[key];
      dataSources[key] = {
        sourceId: key,
        name: key,
        cost: key === 'chart' || key === 'volume' || key === 'funding' ? 1 : 2,
        revealed: false,
        fact: facts[Math.floor(Math.random() * facts.length)],
        isRelevant: true,
      };
    });

    // Generate options
    const options: ScenarioOption[] = template.correctOptions.map((opt: any, i: number) => ({
      id: String.fromCharCode(65 + i), // A, B, C, D
      label: opt.label,
      correct: i === 0, // first option is always correct in templates
      layer1: i === 0 ? `✓ ${template.correctBehavior}` : `✗ ${opt.errors[0] || 'Error'}`,
      layer2: i === 0 
        ? 'Discipline held. Analysis confirmed. Clean execution.'
        : `${opt.errors[0] || 'Mistake'}. Predictable. The entity fed well.`,
      layer3: i === 0
        ? `The correct approach was to ${template.correctBehavior.replace(/_/g, ' ')}. This preserves capital and maintains discipline.`
        : `This choice leads to ${opt.errors.join(' and ')}. On the real market, this would cost you.`,
      errors: opt.errors || [],
      skillDeltas: opt.skillDeltas || {},
    }));

    // Determine level based on entity encounters
    const playerData = this.getPlayerData(playerId);
    const entityRecord = playerData.entityHistory[entityId];
    const entityLevel = entityRecord ? entityRecord.level : 1;

    // Calculate time limit based on difficulty
    const baseTime = 60;
    const timePressureMod = template.corruption / 100;
    const timeLimit = Math.round(baseTime - (timePressureMod * 20) + (condition.modifier * 5));

    // Calculate AP budget
    const apBudget = Math.max(4, 10 - Math.floor(rankIndex / 3));

    // 30% chance of twist event
    const hasTwist = Math.random() < 0.3;
    const twistEvent = hasTwist 
      ? TWIST_EVENTS[Math.floor(Math.random() * TWIST_EVENTS.length)]
      : null;

    const battleId = uuid();
    const scenario: BattleScenario = {
      id: battleId,
      entityId,
      entityName: template.name,
      entityNameRu: template.nameRu,
      archetype: template.archetype,
      discipline: template.discipline,
      threatLevel: template.threatLevel,
      corruption: template.corruption,
      glyph: template.glyph,
      level: entityLevel,
      asset: 'ETH/USDT',
      briefing,
      options,
      dataSources,
      correctOptionId: 'A',
      difficultyAxes: {
        infoDensity: 50 + Math.floor(condition.modifier * 10),
        timePressure: 40 + Math.floor(condition.modifier * 15),
        emotionalIntensity: template.corruption,
        trapSophistication: 50 + entityLevel * 2,
        consequenceWeight: template.corruption,
        uncertaintyLevel: 40 + Math.floor(condition.modifier * 10),
      },
      marketCondition: condition,
      twistEvent,
      timeLimit,
      apBudget,
    };

    const state: BattleState = {
      battleId,
      playerId,
      scenario,
      phase: 'idle',
      timeStarted: 0,
      timeLeft: timeLimit,
      apRemaining: apBudget,
      openedSources: [],
      playerOptionId: null,
      resolved: false,
      result: null,
    };

    this.battles.set(battleId, state);
    return state;
  }

  // ── START BATTLE (idle → prebattle) ──
  startBattle(battleId: string): BattleState {
    const state = this.battles.get(battleId);
    if (!state) throw new Error('Battle not found');
    state.phase = 'prebattle';
    return state;
  }

  // ── GO TO BATTLE (prebattle → battle) ──
  goToBattle(battleId: string): BattleState {
    const state = this.battles.get(battleId);
    if (!state) throw new Error('Battle not found');
    state.phase = 'battle';
    state.timeStarted = Date.now();
    state.timeLeft = state.scenario.timeLimit;
    return state;
  }

  // ── OPEN DATA SOURCE ──
  openSource(battleId: string, sourceId: string): { state: BattleState; fact: string | null } {
    const state = this.battles.get(battleId);
    if (!state || state.phase !== 'battle') throw new Error('Invalid battle state');

    const source = state.scenario.dataSources[sourceId];
    if (!source) throw new Error('Unknown source');
    if (state.openedSources.includes(sourceId)) return { state, fact: source.fact };
    if (state.apRemaining < source.cost) return { state, fact: null }; // not enough AP

    state.apRemaining -= source.cost;
    state.openedSources.push(sourceId);
    source.revealed = true;

    return { state, fact: source.fact };
  }

  // ── SUBMIT DECISION ──
  submitDecision(battleId: string, optionId: string): BattleResult {
    const state = this.battles.get(battleId);
    if (!state || state.phase !== 'battle') throw new Error('Invalid battle state');
    if (state.resolved) throw new Error('Already resolved');

    state.playerOptionId = optionId;
    state.phase = 'result';
    state.resolved = true;

    const option = state.scenario.options.find(o => o.id === optionId);
    const correctOption = state.scenario.options.find(o => o.correct);
    const isCorrect = option?.correct || false;

    // Calculate time spent
    const timeSpent = Math.round((Date.now() - state.timeStarted) / 1000);

    // Calculate XP
    const baseXp = Math.round(state.scenario.corruption * 1.5);
    const timeBonus = Math.max(0, 30 - timeSpent);
    const sourcePenalty = state.openedSources.length * 2;
    const conditionBonus = Math.round(baseXp * (state.scenario.marketCondition.modifier - 1));
    const xpGained = isCorrect 
      ? Math.max(10, baseXp + timeBonus - sourcePenalty + conditionBonus)
      : 5;

    // Calculate $SIG
    const sigGained = isCorrect 
      ? Math.round(10 * state.scenario.marketCondition.modifier)
      : 2;

    // Update player data
    const playerData = this.getPlayerData(state.playerId);
    playerData.xp += xpGained;
    playerData.sigBalance += sigGained;
    playerData.battles++;
    if (isCorrect) {
      playerData.wins++;
      playerData.streak++;
      playerData.longestStreak = Math.max(playerData.longestStreak, playerData.streak);
    } else {
      playerData.streak = 0;
    }

    // Update entity history
    const entityId = state.scenario.entityId;
    if (!playerData.entityHistory[entityId]) {
      playerData.entityHistory[entityId] = { encounters: 0, wins: 0, level: 1, status: 'encountered' };
    }
    const entityRecord = playerData.entityHistory[entityId];
    entityRecord.encounters++;
    if (isCorrect) entityRecord.wins++;
    if (entityRecord.encounters % 3 === 0 && isCorrect) {
      entityRecord.level = Math.min(99, entityRecord.level + 1);
    }
    if (entityRecord.wins >= 7) entityRecord.status = 'mastered';
    else if (entityRecord.wins >= 3) entityRecord.status = 'defeated';
    else entityRecord.status = 'encountered';

    // Update skills
    if (option?.skillDeltas) {
      Object.entries(option.skillDeltas).forEach(([skill, delta]) => {
        if (!playerData.skills[skill]) playerData.skills[skill] = 10;
        playerData.skills[skill] = Math.max(0, Math.min(100, playerData.skills[skill] + delta));
      });
    }

    // Check level up / rank up
    const RANKS = [
      { minXp: 0 }, { minXp: 200 }, { minXp: 500 }, { minXp: 900 }, { minXp: 1400 },
      { minXp: 2000 }, { minXp: 2700 }, { minXp: 3500 }, { minXp: 4400 }, { minXp: 5400 },
      { minXp: 6500 }, { minXp: 7700 }, { minXp: 9000 }, { minXp: 10500 }, { minXp: 12500 },
    ];
    const oldRank = playerData.rankIndex;
    const newRank = RANKS.findIndex((r, i) => i === RANKS.length - 1 || RANKS[i + 1].minXp > playerData.xp);
    if (newRank > oldRank) playerData.rankIndex = newRank;

    // Build result
    const result: BattleResult = {
      battleId,
      playerId: state.playerId,
      entityId,
      entityName: state.scenario.entityName,
      mode: 'training',
      outcome: isCorrect ? 'win' : 'loss',
      correctOptionId: state.scenario.correctOptionId,
      playerOptionId: optionId,
      timeSpent,
      sourcesUsed: state.openedSources,
      xpGained,
      sigGained,
      skillDeltas: option?.skillDeltas || {},
      newStreak: playerData.streak,
      levelUp: false,
      rankUp: newRank > oldRank,
      newAchievements: [],
      timestamp: Date.now(),
      marketCondition: state.scenario.marketCondition.id,
      twistEvent: state.scenario.twistEvent?.id || null,
      entityLevel: entityRecord.level,
      analysis: {
        layer1: isCorrect ? (correctOption?.layer1 || '✓ Correct') : (option?.layer1 || '✗ Incorrect'),
        layer2: isCorrect ? (correctOption?.layer2 || 'Good.') : (option?.layer2 || 'Bad.'),
        layer3: isCorrect ? (correctOption?.layer3 || 'Well done.') : (option?.layer3 || 'Try again.'),
        icon: isCorrect ? '✓' : '✗',
      },
    };

    state.result = result;
    this.savePlayerData(state.playerId, playerData);

    return result;
  }

  // ── TICK (timer update) ──
  tick(battleId: string): { timeLeft: number; phase: string; twistEvent?: TwistEvent } {
    const state = this.battles.get(battleId);
    if (!state || state.phase !== 'battle') return { timeLeft: 0, phase: 'unknown' };

    const elapsed = Math.round((Date.now() - state.timeStarted) / 1000);
    state.timeLeft = Math.max(0, state.scenario.timeLimit - elapsed);

    // Trigger twist at 50% time
    if (state.scenario.twistEvent && elapsed >= state.scenario.timeLimit / 2 && state.phase === 'battle') {
      state.phase = 'twist';
      return { timeLeft: state.timeLeft, phase: 'twist', twistEvent: state.scenario.twistEvent };
    }

    // Auto-resolve on timeout
    if (state.timeLeft <= 0 && !state.resolved) {
      this.submitDecision(battleId, ''); // empty = timeout loss
      return { timeLeft: 0, phase: 'result' };
    }

    return { timeLeft: state.timeLeft, phase: state.phase };
  }

  // ── PLAYER DATA PERSISTENCE ──
  private getPlayerData(playerId: string): PlayerBattleData {
    if (!this.playerStates.has(playerId)) {
      this.playerStates.set(playerId, {
        xp: 0, rankIndex: 0, streak: 0, longestStreak: 0,
        battles: 0, wins: 0, sigBalance: 100,
        skills: {},
        entityHistory: {},
      });
    }
    return this.playerStates.get(playerId)!;
  }

  private savePlayerData(playerId: string, data: PlayerBattleData) {
    this.playerStates.set(playerId, data);
  }

  // ── GET PLAYER STATS ──
  getPlayerStats(playerId: string): PlayerBattleData {
    return this.getPlayerData(playerId);
  }

  // ── GET ACTIVE BATTLE ──
  getBattle(battleId: string): BattleState | undefined {
    return this.battles.get(battleId);
  }
}

interface PlayerBattleData {
  xp: number;
  rankIndex: number;
  streak: number;
  longestStreak: number;
  battles: number;
  wins: number;
  sigBalance: number;
  skills: Record<string, number>;
  entityHistory: Record<string, { encounters: number; wins: number; level: number; status: string }>;
}

// ── SINGLETON ──
export const battleEngine = new BattleEngine();
