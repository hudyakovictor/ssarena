// ============================================================
// SIGNAL ARENA — GAME PROGRESSION SYSTEM (GDD-Level)
// 12 progression axes. Not "levels" — evolution as a trader.
// ============================================================

// ═══════════════════════════════════════════════
// 1. PLAYER PROGRESSION — Evolution of a trader
// ═══════════════════════════════════════════════
export const PLAYER_RANKS = [
  { tier: 0,  name: "Novice",          xp: 0,      quote: "I found easy money.",                 unlock: "Base game" },
  { tier: 1,  name: "Survivor",        xp: 200,    quote: "I understand charts.",                unlock: "Training mode" },
  { tier: 2,  name: "Operator",        xp: 500,    quote: "I understand crypto.",                unlock: "Ghost Duels" },
  { tier: 3,  name: "Analyst",         xp: 900,    quote: "I understand tokenomics.",            unlock: "Advanced cards" },
  { tier: 4,  name: "Strategist",      xp: 1400,   quote: "I understand psychology.",            unlock: "Live Duels" },
  { tier: 5,  name: "Architect",       xp: 2000,   quote: "I understand macro.",                 unlock: "Tournaments" },
  { tier: 6,  name: "Council Candidate",xp: 3000,  quote: "I understand governance.",            unlock: "Council entry" },
  { tier: 7,  name: "Council Member",   xp: 5000,  quote: "I understand nothing.",               unlock: "All entities unlocked" },
  { tier: 8,  name: "Market Legend",    xp: 8000,  quote: "Now I can finally learn.",            unlock: "Endless Gauntlet" },
];

// ═══════════════════════════════════════════════
// 2. KNOWLEDGE PROGRESSION — What you actually learn
// ═══════════════════════════════════════════════
export const KNOWLEDGE_STAGES = [
  { stage: 1, name: "Twitter Believer",  description: "Ты ещё веришь Twitter." },
  { stage: 2, name: "Risk Apprentice",   description: "Начинаешь понимать Risk." },
  { stage: 3, name: "Narrative Reader",  description: "Начинаешь понимать Narrative." },
  { stage: 4, name: "On-chain Explorer", description: "Понимаешь On-chain." },
  { stage: 5, name: "Macro Observer",    description: "Понимаешь Macro." },
  { stage: 6, name: "Governance Auditor",description: "Понимаешь Governance." },
  { stage: 7, name: "Enlightened",       description: "Понимаешь что никто ничего не понимает." },
];

// ═══════════════════════════════════════════════
// 3. ENTITY EVOLUTION — Monsters mutate
// ═══════════════════════════════════════════════
export const ENTITY_EVOLUTION = {
  "Fake Breakout Phantom": [
    { tier: 1, variant: "Phantom",        level: "1-20",   threat: "LOW" },
    { tier: 2, variant: "Elite Phantom",  level: "21-40",  threat: "MEDIUM" },
    { tier: 3, variant: "Nightmare Phantom", level: "41-60", threat: "HIGH" },
    { tier: 4, variant: "Legendary Phantom", level: "61-85", threat: "CRITICAL" },
    { tier: 5, variant: "Council Variant",   level: "86-99", threat: "BLACK SWAN" },
  ],
  "FOMO Wraith": [
    { tier: 1, variant: "FOMO Wraith",       level: "1-15" },
    { tier: 2, variant: "Social Media FOMO", level: "16-35" },
    { tier: 3, variant: "Celebrity FOMO",    level: "36-55" },
    { tier: 4, variant: "ETF FOMO",          level: "56-75" },
    { tier: 5, variant: "Cycle FOMO",        level: "76-90" },
    { tier: 6, variant: "Mass Hysteria",     level: "91-99" },
  ],
};

// ═══════════════════════════════════════════════
// 4. MARKET CONDITIONS — Environmental difficulty
// ═══════════════════════════════════════════════
export const MARKET_CONDITIONS = [
  { id: "stable",      name: "Stable",       modifier: 0.7,  description: "Рынок спокоен. Никто не паникует. Пока." },
  { id: "volatile",    name: "Volatile",     modifier: 1.0,  description: "Обычный день в crypto." },
  { id: "euphoric",    name: "Euphoric",     modifier: 1.3,  description: "Все кричат 'мы богаты'. FOMO повсюду." },
  { id: "fear",        name: "Fear",         modifier: 1.6,  description: "Индекс страха зашкаливает. Паника нарастает." },
  { id: "capitulation",name: "Capitulation", modifier: 2.0,  description: "Все продают. Никто не покупает. Идеальный шторм." },
  { id: "manipulated", name: "Manipulated",  modifier: 2.5,  description: "Киты двигают рынок. Ты — просто наблюдатель." },
  { id: "narrative_bubble", name: "Narrative Bubble", modifier: 3.0, description: "История красивее реальности. Пузырь надувается." },
  { id: "black_swan",  name: "Black Swan",   modifier: 5.0,  description: "Событие, которое никто не предсказал. Кроме тех, кто предсказал." },
];

// ═══════════════════════════════════════════════
// 5. PLAYER REPUTATION — How NPCs see you
// ═══════════════════════════════════════════════
export const REPUTATION_TIERS = [
  { tier: 0, name: "Unknown",         requirement: "Новый игрок" },
  { tier: 1, name: "Retail",          requirement: "50+ боёв" },
  { tier: 2, name: "Trader",          requirement: "200+ боёв, win rate > 40%" },
  { tier: 3, name: "Builder",         requirement: "500+ боёв, 5 mastered entities" },
  { tier: 4, name: "Researcher",      requirement: "1000+ боёв, on-chain skill > 70" },
  { tier: 5, name: "Strategist",      requirement: "Win rate > 60%, 10 entities mastered" },
  { tier: 6, name: "Market Operator", requirement: "Tournament top-10 placement" },
  { tier: 7, name: "Council Member",  requirement: "All 18 entities at Nightmare+" },
  { tier: 8, name: "Legend",          requirement: "Endless Gauntlet: level 80+" },
];

// ═══════════════════════════════════════════════
// 6. DIFFICULTY TIERS — The real ones
// ═══════════════════════════════════════════════
export const DIFFICULTY_TIERS = [
  { id: "paper_hands",     name: "Paper Hands",         description: "Продал при -5%. Ничего страшного. Все начинали." },
  { id: "diamond_hands",   name: "Diamond Hands",       description: "Держал до -50%. Не продал. Уважение." },
  { id: "proof_of_pain",   name: "Proof of Pain",       description: "Пережил медвежий рынок. Дважды." },
  { id: "bear_veteran",    name: "Bear Market Veteran",  description: "2022. LUNA. FTX. Ничего не забыл." },
  { id: "survived_2022",   name: "Survived 2022",       description: "Если ты здесь после 2022 — ты уже победитель." },
  { id: "nothing_hurts",   name: "Nothing Can Hurt Me",  description: "-90%? Это не проблема. Это вторник." },
  { id: "institutional_ptsd", name: "Institutional PTSD", description: "Видел всё. Ничему не удивляюсь. Торгую по плану." },
];

// ═══════════════════════════════════════════════
// 7. WORLD THREAT LEVEL — The market evolves too
// ═══════════════════════════════════════════════
export const WORLD_THREAT = [
  { level: 1, name: "Calm",               eventFrequency: 0.1 },
  { level: 2, name: "Speculation",        eventFrequency: 0.3 },
  { level: 3, name: "Bubble",             eventFrequency: 0.5 },
  { level: 4, name: "Panic",              eventFrequency: 0.7 },
  { level: 5, name: "Collapse",           eventFrequency: 0.9 },
  { level: 6, name: "Recovery",           eventFrequency: 0.4 },
  { level: 7, name: "Narrative Rotation", eventFrequency: 0.6 },
  { level: 8, name: "Cycle Reset",        eventFrequency: 0.2 },
];

// ═══════════════════════════════════════════════
// 8. KNOWLEDGE RANK — Wisdom path
// ═══════════════════════════════════════════════
export const KNOWLEDGE_RANKS = [
  "Ignorance",
  "Curiosity",
  "Experience",
  "Conviction",
  "Doubt",
  "Wisdom",
  "Pattern Recognition",
  "Market Enlightenment",
];

// ═══════════════════════════════════════════════
// 9. MASTERY PER DISCIPLINE
// ═══════════════════════════════════════════════
export const MASTERY_TIERS = {
  technical: ["Observer", "Reader", "Analyst", "Interpreter", "Master"],
  risk:      ["Gambler", "Survivor", "Risk Manager", "Capital Protector", "Risk Architect"],
  onchain:   ["Explorer", "Wallet Tracker", "Forensic Analyst", "Protocol Detective", "Chain Oracle"],
  psychology:["Novice", "Self-Aware", "Disciplined", "Emotionally Neutral", "Zen Trader"],
  security:  ["Tourist", "Code Reader", "Auditor", "Security Architect", "White Hat"],
};

// ═══════════════════════════════════════════════
// 10. ENTITY RARITY — Enemy tiers
// ═══════════════════════════════════════════════
export const ENTITY_RARITY = [
  "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Black Swan", "Historical",
];

// ═══════════════════════════════════════════════
// 11. PLAYER EXPERIENCE — The real journey
// ═══════════════════════════════════════════════
export const PLAYER_JOURNEY = [
  { phase: 1, quote: "I found easy money." },
  { phase: 2, quote: "I understand charts." },
  { phase: 3, quote: "I understand crypto." },
  { phase: 4, quote: "I understand tokenomics." },
  { phase: 5, quote: "I understand psychology." },
  { phase: 6, quote: "I understand macro." },
  { phase: 7, quote: "I understand nothing." },
  { phase: 8, quote: "Now I can finally learn." },
];

// ═══════════════════════════════════════════════
// 12. KNOWLEDGE TREE — What you master
// ═══════════════════════════════════════════════
export const KNOWLEDGE_TREE = {
  Technical:    { icon: "📊", branches: ["Charts","Structure","Patterns","Indicators","Multi-TF"] },
  Risk:         { icon: "⚖️", branches: ["Stop-Loss","Position Sizing","R:R","Correlation","Drawdown"] },
  Psychology:   { icon: "🧠", branches: ["FOMO","Overconfidence","Loss Aversion","Bias","Discipline"] },
  Macro:        { icon: "🌐", branches: ["CPI","Fed Rates","DXY","Global Liquidity","ETF Flows"] },
  Tokenomics:   { icon: "🪙", branches: ["Supply","Emission","Vesting","Unlocks","Revenue"] },
  Security:     { icon: "🛡️", branches: ["Audit","Admin Keys","Proxy","Liquidity Lock","Multisig"] },
  OnChain:      { icon: "🔗", branches: ["Flows","Whale Tracking","Exchange Reserves","Wallet Clusters","TVL"] },
  Governance:   { icon: "🏛️", branches: ["DAO","Voting Power","Timelock","Delegation","Emergency Powers"] },
  AI:           { icon: "🤖", branches: ["Signal Detection","Pattern Recognition","Sentiment","Forecast","Optimization"] },
  GameTheory:   { icon: "🎲", branches: ["Nash Equilibrium","Incentive Design","Attack Vectors","MEV","Strategy"] },
  Behavior:     { icon: "👥", branches: ["Herd","Narrative","Sentiment","Social","Influence"] },
  Narratives:   { icon: "📖", branches: ["AI","DePIN","RWA","Gaming","L2","Modular","Restaking"] },
};

// ═══════════════════════════════════════════════
// SEASONAL / HISTORICAL EVENTS
// ═══════════════════════════════════════════════
export const HISTORICAL_EVENTS = [
  { id: "terra-collapse",  name: "Terra Collapse",  year: 2022, entity: "Loss Aversion Wraith",    difficulty: "Black Swan" },
  { id: "ftx-collapse",    name: "FTX Collapse",    year: 2022, entity: "Insider Syndicate",        difficulty: "Black Swan" },
  { id: "dao-hack",        name: "The DAO Hack",    year: 2016, entity: "Rug Pull Phantom",         difficulty: "Historical" },
  { id: "mt-gox",          name: "Mt.Gox",          year: 2014, entity: "Insider Syndicate",        difficulty: "Historical" },
  { id: "covid-crash",     name: "COVID Crash",     year: 2020, entity: "Headline Titan",           difficulty: "Black Swan" },
  { id: "black-thursday",  name: "Black Thursday",  year: 2020, entity: "Liquidity Hydra",          difficulty: "Black Swan" },
  { id: "merge-event",     name: "Ethereum Merge",  year: 2022, entity: "Confirmation Bias Cult",   difficulty: "Legendary" },
  { id: "luna-depeg",      name: "UST Depeg",       year: 2022, entity: "Leverage Goblin",          difficulty: "Black Swan" },
  { id: "3ac-collapse",    name: "3AC Collapse",    year: 2022, entity: "Hubris Dragon",            difficulty: "Legendary" },
  { id: "svb-collapse",    name: "SVB Collapse",    year: 2023, entity: "Macro Storm Titan",       difficulty: "Legendary" },
];

export default { PLAYER_RANKS, KNOWLEDGE_STAGES, ENTITY_EVOLUTION, MARKET_CONDITIONS,
  REPUTATION_TIERS, DIFFICULTY_TIERS, WORLD_THREAT, KNOWLEDGE_RANKS,
  MASTERY_TIERS, ENTITY_RARITY, PLAYER_JOURNEY, KNOWLEDGE_TREE, HISTORICAL_EVENTS };
