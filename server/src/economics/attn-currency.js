// ============================================================
// ATTN — Attention Credits (Utility Soft-Currency)
// Dual-token layer: $SIG (governance) + ATTN (utility)
// Industry best practice 2026: separate governance from utility
// ============================================================

export const ATTN = {
  name: "Attention Credits",
  symbol: "ATTN",
  type: "off-chain utility currency",
  ticker: "ATTN",

  // Peg: 1 ATTN = $0.01 USD (stable reference for players)
  usdPeg: 0.01,

  // Conversion: $SIG → ATTN (ONE-WAY burn)
  // If $SIG = $0.50, then 1 $SIG = 50 ATTN
  // The $SIG used for conversion is BURNED.
  conversion: {
    type: "one-way-burn",
    formula: "ATTN = SIG_amount × ($SIG_USD_price / ATTN_USD_peg)",
    minConversion: 10,   // $SIG
    maxConversion: 10000, // $SIG per transaction
    fee: 0,              // 0% fee (burn itself is the sink)
  },

  // Earning rates
  earning: {
    dailyPuzzleCorrect: 5,      // ATTN per correct answer
    battleVictory: 10,           // Base ATTN per win
    battleStreak: 3,             // Bonus per streak day
    tournamentRank: [50, 30, 20, 10], // Top 4
    contentCreation: 100,        // Approved scenario
    referralSignup: 20,          // Per referred player
    rankUp: 50,                  // One-time per rank
  },

  // Spending (sinks)
  sinks: {
    apReplenish: 5,             // +1 Attention Point
    cardSkinCommon: 25,
    cardSkinRare: 75,
    cardSkinEpic: 200,
    avatarBasic: 50,
    boardSkin: 150,
    emote: 10,
    tournamentEntry: 25,        // Weekly free tournament
    scenarioSubmission: 50,     // Submit for review
  },

  // Daily cap (anti-inflation)
  dailyCap: {
    maxEarned: 200,             // Max ATTN earned per day
    maxSpent: 500,              // Max ATTN spent per day
    resetAt: "00:00 UTC",
  },
};

// ── ATTN BALANCE MANAGEMENT ──
export class AttnManager {
  constructor(playerBalance = 100) {
    this.balance = playerBalance;
    this.earnedToday = 0;
    this.spentToday = 0;
    this.transactions = [];
  }

  earn(amount, source) {
    const effective = Math.min(amount, ATTN.dailyCap.maxEarned - this.earnedToday);
    if (effective <= 0) return { success: false, reason: "Daily earning cap reached" };

    this.balance += effective;
    this.earnedToday += effective;
    this.transactions.push({ type: "earn", amount: effective, source, timestamp: Date.now() });
    return { success: true, earned: effective, newBalance: this.balance };
  }

  spend(amount, purpose) {
    const effective = Math.min(amount, this.balance, ATTN.dailyCap.maxSpent - this.spentToday);
    if (effective <= 0) return { success: false, reason: "Insufficient balance or daily cap" };

    this.balance -= effective;
    this.spentToday += effective;
    this.transactions.push({ type: "spend", amount: effective, purpose, timestamp: Date.now() });
    return { success: true, spent: effective, newBalance: this.balance };
  }

  // Daily reset (called at 00:00 UTC)
  resetDaily() {
    this.earnedToday = 0;
    this.spentToday = 0;
  }

  // $SIG → ATTN conversion (BURNS $SIG)
  convertFromSIG(sigAmount, sigUsdPrice) {
    const attnAmount = Math.floor(sigAmount * (sigUsdPrice / ATTN.usdPeg));
    this.balance += attnAmount;
    this.transactions.push({ type: "convert", sigBurned: sigAmount, attnReceived: attnAmount, sigPrice: sigUsdPrice, timestamp: Date.now() });
    return { sigBurned: sigAmount, attnReceived: attnAmount, newBalance: this.balance };
  }
}
