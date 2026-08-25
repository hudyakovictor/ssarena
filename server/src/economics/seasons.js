// ============================================================
// SEASONS — Season Pass + Soulbound NFT Badges
// 3-month seasonal passes. Limited edition content.
// ============================================================

export const SEASONS = {
  current: "Season 1: Genesis Arena",
  duration: 90, // days
  passCost: 1500, // $SIG
  passBenefits: [
    "Exclusive badge: 'Genesis Analyst' (soulbound)",
    "3 limited-edition card skins/month",
    "Early access to new Market Entities",
    "Double ATTN from daily puzzles",
    "Priority queue in Ghost Duels",
    "Weekly AI Coach deep-dive",
  ],

  // Seasonal content rotation
  rotation: {
    featuredEntities: ["FOMO Wraith", "Leverage Goblin", "Honeypot Mimic"],
    seasonalScenarioPack: "market-crash-survival-pack",
    limitedSkins: ["Genesis Gold Frame", "Founder's Board", "Whale Watcher Avatar"],
  },

  // Badge system
  badges: [
    { id: "genesis-analyst", name: "Genesis Analyst", rarity: "legendary", condition: "Season 1 Pass holder" },
    { id: "fomo-slayer-s1", name: "FOMO Slayer S1", rarity: "epic", condition: "Defeat FOMO Wraith 10 times in S1" },
    { id: "perfect-week-s1", name: "Perfect Week S1", rarity: "rare", condition: "7-day streak in S1" },
    { id: "top-100-s1", name: "Top 100 S1", rarity: "mythic", condition: "Top 100 leaderboard at S1 end" },
  ],
};

export const UPCOMING_SEASONS = [
  { name: "Season 2: Whale Hunt", theme: "On-chain Analysis", featuredEntity: "Whale Syndicate", eta: "Q1 2027" },
  { name: "Season 3: Audit Wars", theme: "Smart Contract Security", featuredEntity: "Honeypot Mimic", eta: "Q2 2027" },
  { name: "Season 4: Macro Storm", theme: "Global Markets", featuredEntity: "Headline Titan", eta: "Q3 2027" },
];

// ── SEASON MANAGER ──
export class SeasonManager {
  constructor() {
    this.currentSeason = SEASONS;
    this.seasonStart = new Date("2026-10-01"); // Planned start
    this.seasonEnd = new Date(this.seasonStart.getTime() + 90 * 86400000);
  }

  daysRemaining() {
    return Math.max(0, Math.ceil((this.seasonEnd.getTime() - Date.now()) / 86400000));
  }

  isActive() { return Date.now() >= this.seasonStart.getTime() && Date.now() < this.seasonEnd.getTime(); }

  getProgress() {
    const total = this.seasonEnd.getTime() - this.seasonStart.getTime();
    const elapsed = Date.now() - this.seasonStart.getTime();
    return Math.min(100, Math.round((elapsed / total) * 100));
  }

  getRewardsForRank(rank) {
    if (rank <= 10) return "🏆 Mythic Badge + 5,000 ATTN";
    if (rank <= 100) return "🥇 Legendary Badge + 1,000 ATTN";
    if (rank <= 1000) return "🥈 Epic Badge + 500 ATTN";
    return "🥉 Participation Badge + 100 ATTN";
  }
}

export const seasonManager = new SeasonManager();
