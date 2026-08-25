// ============================================================
// AI ORCHESTRATOR — Core Decision-Support System
// Runs all 5 intelligence modules. Produces unified 20/80 report.
// This is NOT a chatbot. It's an operational co-pilot.
// ============================================================
import { RetentionIntelligence } from "./retention.js";
import { EconomyIntelligence } from "./economy.js";
import { LiveOpsIntelligence } from "./liveops.js";

export class AICoPilot {
  constructor() {
    this.modules = {
      retention: new RetentionIntelligence(),
      economy: new EconomyIntelligence(),
      liveops: new LiveOpsIntelligence(),
    };
    this.lastScan = null;
    this.recommendationHistory = [];
  }

  /**
   * Full system scan — runs all 5 intelligence modules.
   * @param {Object} state — aggregated metrics from derived tables
   * @returns {Object} Unified decision-support report
   */
  scan(state = {}) {
    const results = {};
    const allAlerts = [];
    const allInsights = [];

    // Run each module
    for (const [name, module] of Object.entries(this.modules)) {
      results[name] = module.analyze(state);
      allAlerts.push(...results[name].alerts);
      allInsights.push(...results[name].insights);
    }

    // Find top 3 highest-impact actions across ALL modules (20/80)
    const allActions = [];
    for (const result of Object.values(results)) {
      for (const alert of result.alerts) {
        for (const action of alert.suggestedActions || []) {
          allActions.push({
            ...action,
            module: alert.module,
            metric: alert.metric,
            severity: alert.severity,
            insight: alert.insight,
          });
        }
      }
    }
    allActions.sort((a, b) => b.impact - a.impact);
    const top3 = allActions.slice(0, 3);

    // Health summary
    const criticalCount = allAlerts.filter((a) => a.severity === "CRITICAL").length;
    const highCount = allAlerts.filter((a) => a.severity === "HIGH").length;
    const overallHealth = criticalCount > 0 ? "critical" : highCount > 2 ? "warning" : "healthy";

    this.lastScan = {
      timestamp: new Date().toISOString(),
      overallHealth,
      modules: results,
      stats: {
        totalAlerts: allAlerts.length,
        criticalAlerts: criticalCount,
        highAlerts: highCount,
        insights: allInsights.length,
        recommendations: allActions.length,
      },
      top3Actions: top3,
      executiveSummary: this._buildExecutiveSummary(results, top3, overallHealth),
    };

    return this.lastScan;
  }

  _buildExecutiveSummary(results, top3, health) {
    const lines = [];
    if (health === "critical") {
      lines.push("🚨 CRITICAL: Обнаружены проблемы, требующие немедленного внимания.");
    } else if (health === "warning") {
      lines.push("⚡ WARNING: Несколько зон требуют внимания. Приоритеты ниже.");
    } else {
      lines.push("✅ Все системы в норме. Фокус на масштабировании.");
    }

    if (top3.length > 0) {
      lines.push(`\n🎯 TOP 3 ДЕЙСТВИЯ (20% усилий → 80% результата):`);
      top3.forEach((a, i) => {
        lines.push(`  ${i + 1}. [${a.module}] ${a.desc} (impact: ${a.impact}/100, effort: ${a.effort})`);
      });
    }

    lines.push(`\n📊 Модули: R:${results.retention.health} | E:${results.economy.health} | L:${results.liveops.health}`);

    return lines.join("\n");
  }

  /**
   * Track recommendation outcomes for ROI measurement.
   */
  trackRecommendation(id, outcome) {
    this.recommendationHistory.push({ id, ...outcome, trackedAt: new Date().toISOString() });
    // Store in metrics_ai_recommendations for future ROI analysis
  }

  /**
   * Generate the Monday morning executive summary.
   */
  weeklyBrief(weekData = {}) {
    if (!this.lastScan) this.scan(weekData);

    return {
      title: "📊 SIGNAL ARENA — AI CO-PILOT WEEKLY BRIEF",
      week: weekData.week || new Date().toISOString().slice(0, 10),
      health: this.lastScan.overallHealth,
      topActions: this.lastScan.top3Actions,
      metrics: {
        retention: weekData.d7Retention ? `${Math.round(weekData.d7Retention * 100)}%` : "N/A",
        premiumConversion: weekData.premiumConversion ? `${Math.round(weekData.premiumConversion * 100)}%` : "N/A",
        burnRatio: weekData.burnRatio ? `${Math.round(weekData.burnRatio * 100)}%` : "N/A",
        activePlayers: weekData.activePlayers || "N/A",
        revenue: weekData.weeklyRevenue ? `$${weekData.weeklyRevenue.toLocaleString()}` : "N/A",
        tokenPrice: weekData.tokenPrice ? `$${weekData.tokenPrice}` : "N/A",
      },
      moduleReports: {
        retention: this.lastScan.modules.retention?.summary || "N/A",
        economy: this.lastScan.modules.economy?.summary || "N/A",
        liveops: this.lastScan.modules.liveops?.summary || "N/A",
      },
      recommendedFocus: this.lastScan.top3Actions?.[0]?.desc || "Продолжать мониторинг.",
    };
  }
}

// Singleton
export const coPilot = new AICoPilot();
