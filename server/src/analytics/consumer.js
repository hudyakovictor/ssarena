// ============================================================
// ANALYTICS CONSUMER — Offline AI Analysis Pipeline ($16.2)
// Consumes events from message broker
// Runs: node src/analytics/consumer.js
// ============================================================
import { CONFIG } from "../config/index.js";
import { broker } from "../lib/broker.js";

class AnalyticsConsumer {
  constructor() {
    this.stats = {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      avgScore: 0,
      entityEncounters: {},
      errorFrequency: {},
      playerActivity: {},
    };
  }

  async start() {
    console.log("📊 Analytics Consumer — Starting...");
    console.log(`   Broker: ${CONFIG.BROKER.TYPE}`);
    console.log(`   Topics: ${Object.values(CONFIG.BROKER.TOPICS).join(", ")}`);

    // Subscribe to battle events
    broker.subscribe("sa.battle.events", (event) => {
      if (event.type === "result") {
        this.stats.totalBattles++;
        if (event.result === "win") this.stats.wins++;
        else this.stats.losses++;

        // Track entity encounters
        const entityId = event.entityId || "unknown";
        this.stats.entityEncounters[entityId] = (this.stats.entityEncounters[entityId] || 0) + 1;
      }
    });

    // Subscribe to error logs
    broker.subscribe("sa.errors", (event) => {
      const errorId = event.errorId || "unknown";
      this.stats.errorFrequency[errorId] = (this.stats.errorFrequency[errorId] || 0) + 1;
    });

    // Subscribe to player actions
    broker.subscribe("sa.player.actions", (event) => {
      this.stats.playerActivity[event.playerId] = (this.stats.playerActivity[event.playerId] || 0) + 1;
    });

    // Print periodic summary
    setInterval(() => this.printSummary(), 60000);
  }

  printSummary() {
    if (this.stats.totalBattles === 0) return;
    const winRate = Math.round((this.stats.wins / this.stats.totalBattles) * 100);
    const topEntities = Object.entries(this.stats.entityEncounters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    console.log(`\n📊 [Analytics Summary]`);
    console.log(`   Battles: ${this.stats.totalBattles} | Win rate: ${winRate}%`);
    console.log(`   Active players: ${Object.keys(this.stats.playerActivity).length}`);
    if (topEntities.length) {
      console.log(`   Top entities: ${topEntities.map(([e, c]) => `${e}(${c})`).join(", ")}`);
    }
  }

  /**
   * AI PREDICTIVE ANALYSIS (Offline, local)
   *
   * When connected to real data, this would:
   * 1. Detect anomaly zones: scenarios where >85% players fail
   * 2. Cluster players by cognitive profiles
   * 3. Predict churn based on discipline_shield decline
   * 4. Generate recommendations:
   *    "В Лиге 3-5 аномальный рост Overleverage.
   *     Рекомендовано: повысить шанс выпадения Risk/Reward на 14%."
   *
   * This runs LOCALLY — never on production server.
   */
  async runAIAnalysis() {
    // TODO: Connect to local LLM (via OpenRouter or local model)
    // Analyze aggregated stats
    // Generate PDF report for admin
    console.log("🧠 AI Analysis placeholder — connect to OpenRouter for real analysis");
  }
}

// Run if called directly
if (process.argv[1]?.includes("consumer")) {
  const consumer = new AnalyticsConsumer();
  consumer.start().catch(console.error);
}

export { AnalyticsConsumer };
