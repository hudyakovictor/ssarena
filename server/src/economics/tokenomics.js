// ============================================================
// SIGNAL ARENA — TOKENOMICS ENGINE (GameFi 2.0)
// Design goal: become the textbook example of sustainable
// play-to-improve tokenomics that drives price through utility,
// not speculation. No Ponzi. No inflation spiral.
//
// $SIG Token — Utility + Governance + Reputation
//
// KEY INSIGHT:
// Traditional GameFi: "play to earn" → inflation → death spiral
// Signal Arena:     "play to improve" → skill unlocks → premium demand
//                   + sink mechanisms > emission → deflationary pressure
// ============================================================

// ═══════════════════════════════════════════════════════════
// TOKEN PARAMETERS
// ═══════════════════════════════════════════════════════════
export const TOKEN = {
  symbol: "$SIG",
  name: "Signal Token",
  decimals: 18,
  // Fixed supply — no infinite minting. Scarcity = value.
  totalSupply: 1_000_000_000, // 1 billion
  initialCirculating: 50_000_000, // 5% at launch
  // Emission schedule: halving every 2 years, fully distributed over 10 years
  emissionSchedule: {
    years: 10,
    halvingPeriod: 2, // years
    initialYearlyEmission: 95_000_000, // Year 1: 95M tokens
    // Year 1-2: 95M/yr, Year 3-4: 47.5M/yr, Year 5-6: 23.75M/yr...
  },
};

// ═══════════════════════════════════════════════════════════
// DISTRIBUTION (TRANSPARENT, NO HIDDEN ALLOCATIONS)
// ═══════════════════════════════════════════════════════════
export const DISTRIBUTION = {
  communityRewards: 45,   // 450M — Earned through gameplay, tournaments, content
  ecosystemGrowth: 20,     // 200M — Liquidity pools, exchange listings, partnerships
  teamAndAdvisors: 15,     // 150M — 4-year vesting with 1-year cliff
  treasury: 12,            // 120M — Governance-decided, emergency fund, buybacks
  initialLiquidity: 5,     // 50M — DEX liquidity at TGE
  airdrop: 3,              // 30M — Early supporters, testers, community builders
};

// ═══════════════════════════════════════════════════════════
// EARNING MECHANISMS (HOW PLAYERS GET $SIG)
// ═══════════════════════════════════════════════════════════
export const EARNING = {
  // Daily Puzzle reward (small, consistent)
  dailyPuzzle: {
    baseReward: 2,          // $SIG per correct answer
    streakMultiplier: 0.5,  // +0.5 per streak day
    maxStreakBonus: 15,     // Cap at 30-day streak
    condition: "Correct answer within time limit",
  },

  // PvP Duels (risk-reward)
  ghostDuels: {
    entryFee: 5,            // $SIG to enter (goes to prize pool)
    winnerGets: "85%",      // 85% of opponent's entry
    protocolFee: "15%",     // 15% to treasury (sink mechanism)
    minRankDifference: 3,    // Fair matching
  },

  // Tournaments (prize pools from entries)
  tournaments: {
    entryFeePercent: 10,    // 10% of prize pool
    distribution: [50, 25, 15, 10], // Top 4 split
    protocolFee: "10%",     // Treasury sink
  },

  // Content creation (community-generated scenarios)
  contentCreation: {
    rewardPerApprovedScenario: 100,
    bonusPer1000Plays: 25,
    condition: "Scenario passes AI verifier + human review",
  },

  // Skill milestones (one-time, soulbound)
  skillMilestones: {
    rankUp: 10,
    entityMastered: 25,
    errorFixed: 5,
    badgeEarned: 15,
  },
};

// ═══════════════════════════════════════════════════════════
// SINK MECHANISMS (CRITICAL — WHERE TOKENS GO TO DIE)
// Without sinks, every earned token dilutes everyone.
// With sinks > emission → deflationary pressure → price up.
// ═══════════════════════════════════════════════════════════
export const SINKS = {
  // 1. Premium Subscriptions (largest sink)
  premiumAI: {
    monthlyCost: 500,       // $SIG/month for AI Coach Pro
    estimatedSubscribers: "5-15% of active players",
    annualSink: "~30M $SIG at 10K subscribers",
    burns: true,            // Tokens are BURNED, not recycled
  },

  // 2. Cosmetics (pure sink)
  cosmetics: {
    cardSkins: [200, 500, 1000, 2500], // $SIG per skin by rarity
    boardSkins: [500, 1500, 5000],
    avatars: [100, 300, 800, 2000],
    emotes: [50, 150],
    allBurned: true,        // ALL cosmetic purchases BURN tokens
  },

  // 3. Season Pass
  seasonPass: {
    cost: 1500,             // $SIG per season (3 months)
    includes: ["Exclusive badges", "Premium scenarios", "Early access", "No ads"],
    burned: "70%",          // 70% burned, 30% to prize pools
  },

  // 4. Tournament Entry Fees
  tournamentFees: {
    percentToBurn: 50,      // 50% of protocol fee burned
    percentToTreasury: 50,  // 50% to treasury
  },

  // 5. Custom Tournament Creation
  createTournament: {
    cost: 2000,             // $SIG to create
    prizePoolRequired: 5000,// Minimum prize pool
    burned: true,
  },

  // 6. Marketplace Fees (when NFT marketplace opens)
  marketplace: {
    listingFee: 10,         // $SIG per listing
    tradeFee: "2.5%",       // Per trade
    burned: "50%",          // 50% burned, 50% to treasury
  },

  // 7. Anti-Spam / Quality
  antiSpam: {
    scenarioSubmissionFee: 25,  // Refunded if approved
    burnedIfRejected: true,
  },
};

// ═══════════════════════════════════════════════════════════
// THE FLYWHEEL — HOW PLAYING DRIVES PRICE UP
// ═══════════════════════════════════════════════════════════
export const FLYWHEEL = {
  description: `
    ┌─────────────────────────────────────────────────────────┐
    │              THE SIGNAL ARENA FLYWHEEL                  │
    │                                                         │
    │   More Players → More Premium Subs → More Token Burns   │
    │        ↑                                      ↓         │
    │   Better Content ← More Sinks ← Scarcer Supply          │
    │        ↑                                      ↓         │
    │   Higher Engagement ← Price Appreciation ← Demand > Supply
    │        ↑                                      ↓         │
    │   More Tournaments → More Entry Fees → More Burns       │
    │                                                         │
    │   POSITIVE FEEDBACK LOOP — NO INFLATION DEATH SPIRAL    │
    └─────────────────────────────────────────────────────────┘
  `,

  // Mathematical model
  // Let E = emission rate (tokens/day)
  // Let B = burn rate (tokens/day)
  // Let P = price ($/token)
  // Let N = active players
  //
  // B = f(N) * avg_spend_per_player * burn_ratio
  // At N=100K players, if 5% are premium, avg_spend=800 $SIG/month:
  // B = 5000 * 800 * 0.8 = 3,200,000 $SIG/month BURNED
  //
  // Emission at year 1: E = 95M / 12 = 7.9M $SIG/month
  // At 100K players: B/E = 3.2M / 7.9M = 40% burn ratio
  // At 500K players: B/E = 16M / 7.9M = 200% → DEFLATIONARY!
  //
  // After first halving (year 3): E = 47.5M / 12 = 3.96M/month
  // At 100K players: B/E = 3.2M / 3.96M = 81%
  // At 200K players: B/E = 6.4M / 3.96M = 162% → DEFLATIONARY

  breakEvenAnalysis: {
    description: "Number of active players needed to reach burn = emission",
    year1: 247_000,     // 247K active players for B=E in year 1
    year3: 124_000,     // 124K (halving makes it easier)
    year5: 62_000,      // 62K
    year10: 15_000,     // Emission drops to near-zero — any player base is deflationary
  },
};

// ═══════════════════════════════════════════════════════════
// ECONOMIC AI OVERSEER — AUTONOMOUS BALANCING
// ═══════════════════════════════════════════════════════════
export class EconomicOverseer {
  constructor() {
    this.alerts = [];
    this.metrics = {};
    this.rebalancingHistory = [];
  }

  /**
   * Analyze current economic state and detect imbalances.
   * Called every 6 hours by AI Co-Pilot.
   */
  analyze(state) {
    const issues = [];

    // 1. Check burn/emission ratio
    const burnRate = state.dailyBurns || 0;
    const emissionRate = state.dailyEmission || 0;
    const burnRatio = emissionRate > 0 ? burnRate / emissionRate : 0;

    if (burnRatio < 0.3) {
      issues.push({
        severity: "HIGH",
        metric: "burn_ratio",
        value: Math.round(burnRatio * 100) + "%",
        target: "> 30%",
        recommendation: "Запустить limited-edition скины. Предложить скидку 20% на Season Pass новым игрокам.",
        aiAction: "AUTO_DEPLOY_SKIN_SALE",
      });
    }

    // 2. Check token concentration (whale risk)
    if (state.top10HolderPercent > 45) {
      issues.push({
        severity: "MEDIUM",
        metric: "whale_concentration",
        value: state.top10HolderPercent + "%",
        target: "< 45%",
        recommendation: "Стимулировать мелких держателей через staking-бонусы.",
        aiAction: "ALERT_ONLY",
      });
    }

    // 3. Check premium conversion
    const premiumRate = state.activePlayers > 0 ? state.premiumPlayers / state.activePlayers : 0;
    if (premiumRate < 0.03) {
      issues.push({
        severity: "MEDIUM",
        metric: "premium_conversion",
        value: Math.round(premiumRate * 100) + "%",
        target: "> 5%",
        recommendation: "A/B тест: показывать AI Coach демо после каждого 3-го боя.",
        aiAction: "AUTO_AB_TEST",
      });
    }

    // 4. Check player retention
    if (state.d7Retention < 0.3) {
      issues.push({
        severity: "CRITICAL",
        metric: "d7_retention",
        value: Math.round(state.d7Retention * 100) + "%",
        target: "> 30%",
        recommendation: "Анализировать точки оттока. Усилить онбординг. Добавить социальные механики.",
        aiAction: "ALERT_ONLY",
      });
    }

    // 5. Check content freshness
    const daysSinceLastContent = state.daysSinceLastScenario;
    if (daysSinceLastContent > 7) {
      issues.push({
        severity: "HIGH",
        metric: "content_freshness",
        value: daysSinceLastContent + " days",
        target: "< 7 days",
        recommendation: "AI-генерация 10 новых сценариев из исторических данных.",
        aiAction: "AUTO_GENERATE_SCENARIOS",
      });
    }

    this.alerts = issues;
    return { healthy: issues.filter(i => i.severity === "CRITICAL").length === 0, issues, burnRatio, timestamp: new Date().toISOString() };
  }

  /**
   * Autonomous rebalancing actions that AI can take without human approval.
   * Human sees the action in the overseer dashboard.
   */
  getAutonomousActions() {
    return this.alerts
      .filter(i => i.aiAction?.startsWith("AUTO_"))
      .map(i => ({
        trigger: i.metric,
        action: i.aiAction,
        recommendation: i.recommendation,
        requiresApproval: i.aiAction === "ALERT_ONLY",
      }));
  }
}

// ═══════════════════════════════════════════════════════════
// REVENUE MODEL — ALL STREAMS (TARGET: $1B)
// ═══════════════════════════════════════════════════════════
export const REVENUE_MODEL = {
  philosophy: "Revenue = value delivered. No extraction without value.",
  streams: [
    {
      name: "Premium AI Coach Pro",
      price: "$9.99/month",
      targetConversion: "5% of active players",
      year1Revenue: "At 100K MAU: 5000 × $9.99 × 12 = $599K/yr",
      year3Revenue: "At 1M MAU: 50000 × $9.99 × 12 = $5.99M/yr",
      scalability: "Near-zero marginal cost. Pure software margin.",
    },
    {
      name: "Season Pass",
      price: "$14.99/season (3 months)",
      targetConversion: "12% of active players",
      year1Revenue: "At 100K MAU: 12000 × $14.99 × 4 = $720K/yr",
      year3Revenue: "At 1M MAU: 120000 × $14.99 × 4 = $7.2M/yr",
      scalability: "Content creation cost, but AI-generated scenarios reduce it 10x.",
    },
    {
      name: "Cosmetics Store",
      price: "$0.99 — $49.99",
      targetConversion: "15% of players, avg $5/month",
      year1Revenue: "At 100K MAU: 15000 × $5 × 12 = $900K/yr",
      year3Revenue: "At 1M MAU: 150000 × $5 × 12 = $9M/yr",
      scalability: "Digital goods. AI generates designs. Infinite margin.",
    },
    {
      name: "Tournament Hosting Fees",
      price: "15% of prize pool",
      targetVolume: "10% of MAU plays tournaments monthly",
      year1Revenue: "At 100K MAU: 10000 players × avg $5 entry × 15% × 12 = $90K/yr",
      year3Revenue: "At 1M MAU: $900K/yr",
      scalability: "Community-run tournaments scale organically.",
    },
    {
      name: "Institutional API Access",
      price: "$499 — $4999/month",
      target: "Trading firms, funds, educational platforms",
      description: "Historical scenario data, skill assessment API, white-label academy",
      year3Revenue: "50 institutional clients × avg $1000 × 12 = $600K/yr",
      year5Revenue: "500 institutional clients = $6M/yr",
      scalability: "High-value, low-volume. B2B SaaS model.",
    },
    {
      name: "Token Treasury Growth",
      price: "Non-dilutive — from protocol fees",
      description: "15% of duel fees, 10% of tournament fees, 50% of marketplace fees → treasury",
      year3Value: "At $SIG market cap $100M, treasury holds 12% = $12M",
      year5Value: "At $SIG market cap $1B, treasury = $120M",
      scalability: "Treasury funds ecosystem growth, buybacks, liquidity.",
    },
    {
      name: "Educational Partnerships",
      price: "Revenue share with trading academies",
      description: "Signal Arena as practical exam platform for trading courses",
      year3Revenue: "10 partnerships × $50K each = $500K/yr",
      year5Revenue: "100 partnerships = $5M/yr",
    },
  ],

  // Path to $1B valuation
  pathToUnicorn: `
    ┌──────────────────────────────────────────────────────────────┐
    │                 PATH TO $1,000,000,000                        │
    │                                                               │
    │  Year 1-2: Product-Market Fit                                 │
    │    • 100K MAU, $2.3M ARR from revenue streams                │
    │    • $SIG token: utility demand drives price to $0.50         │
    │    • Implied FDV: $500M                                       │
    │    • Revenue multiple: 10x = $23M valuation component         │
    │                                                               │
    │  Year 3-4: Growth Phase                                       │
    │    • 1M MAU, $23.7M ARR                                       │
    │    • Token sinks > emission → deflationary                    │
    │    • Token price: $2.00 (FDV $2B)                             │
    │    • Revenue component: $237M at 10x                          │
    │    • Institutional revenue: $600K                             │
    │                                                               │
    │  Year 5: Category Dominance                                   │
    │    • 5M MAU, $50M+ ARR                                        │
    │    • Token: $5.00 (deflationary, 80% burned)                  │
    │    • Market cap: $5B (token) + $500M (revenue multiple)        │
    │    • "The Duolingo of trading" — category-defining              │
    │                                                               │
    │  KEY: Token ≠ speculation. Token = access to premium.         │
    │  Revenue = fiat from subscriptions, not token sales.          │
    │  Token value = result of utility, not cause.                   │
    └──────────────────────────────────────────────────────────────┘
  `,
};
