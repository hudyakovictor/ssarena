// ============================================================
// AI CO-PILOT — Virtual Agent Verifier + Predictive Analytics
// §16.2-А: Scenario validation with virtual trader agents
// §16.2-Б: Anomaly detection, churn prediction, card balancing
// ============================================================
import { getContentDB } from "../db/index.js";

// ── 5 VIRTUAL TRADER AGENTS with different profiles ──
const AGENTS = {
  "fomo-bot": {
    name: "FOMO Bot", aggression: 0.9, patience: 0.1, discipline: 0.2, bias: "chase",
    description: "Покупает на импульсе, игнорирует перегрев",
    pick: (opts) => opts.find(o => /лонг|купить|long|buy/i.test(o.label)) || opts[1],
  },
  "satoshi-sleuth": {
    name: "Satoshi Sleuth", aggression: 0.3, patience: 0.95, discipline: 0.95, bias: "verify",
    description: "Проверяет всё: контракт, ончейн, холдеров",
    pick: (opts) => opts.find(o => o.correct === 1) || opts[0],
  },
  "bastion": {
    name: "Bastion", aggression: 0.2, patience: 0.9, discipline: 0.98, bias: "defend",
    description: "Risk-first: стоп, R:R, position sizing",
    pick: (opts) => opts.find(o => /стоп|риск|stop|risk/i.test(o.label)) || opts[0],
  },
  "degen-gambler": {
    name: "Degen Gambler", aggression: 1.0, patience: 0.0, discipline: 0.05, bias: "random",
    description: "Случайный выбор, без анализа",
    pick: (opts) => opts[Math.floor(Math.random() * opts.length)],
  },
  "contrarian": {
    name: "Contrarian", aggression: 0.6, patience: 0.7, discipline: 0.8, bias: "fade",
    description: "Всегда против толпы, ищет contrarian сигналы",
    pick: (opts) => opts.find(o => /шорт|ждать|short|wait|contrarian/i.test(o.label)) || opts[3] || opts[0],
  },
};

export class ScenarioVerifier {
  constructor() { this.results = []; }

  verify(scenarioId) {
    const db = getContentDB();
    const s = db.prepare("SELECT * FROM scenarios WHERE id = ?").get(scenarioId);
    if (!s) return { pass: false, error: "Not found" };
    const opts = db.prepare("SELECT * FROM scenario_options WHERE scenario_id = ?").all(scenarioId);
    if (!opts || opts.length < 3) return { pass: false, error: "Need >=3 options" };
    const correctCount = opts.filter(o => o.correct === 1).length;
    if (correctCount !== 1) return { pass: false, error: `Expected 1 correct, got ${correctCount}` };

    const agentRuns = Object.entries(AGENTS).map(([id, agent]) => {
      const chosen = agent.pick(opts);
      return { agent: agent.name, agentId: id, bias: agent.bias, chosenOption: chosen?.opt_index || "?", correct: chosen?.correct === 1, discipline: agent.discipline };
    });

    const correctOpt = opts.find(o => o.correct === 1);
    const issues = [];
    if (!correctOpt?.layer2 || correctOpt.layer2.length < 5) issues.push("Layer 2 too short");
    if (!correctOpt?.layer3 || correctOpt.layer3.length < 20) issues.push("Layer 3 too short");
    if (new Set(opts.map(o => o.label.slice(0, 30))).size < 3) issues.push("Options too similar");
    const axes = JSON.parse(s.difficulty_axes || "{}");
    if (Object.keys(axes).length < 3) issues.push("Missing difficulty axes");

    const winRate = agentRuns.filter(r => r.correct).length / agentRuns.length;
    if (winRate > 0.8) issues.push(`Too easy: ${Math.round(winRate * 100)}% agents correct`);
    if (winRate < 0.1) issues.push(`Too hard: ${Math.round(winRate * 100)}% agents correct`);

    this.results.push({
      scenarioId, level: s.level, entity: s.entity_id, timestamp: new Date().toISOString(),
      pass: issues.length === 0, score: Math.max(0, 100 - issues.length * 15),
      issues, agentRuns, recommendation: issues.length === 0 ? "Ready" : `Fix ${issues.length} issues`,
    });
    return this.results[this.results.length - 1];
  }

  verifyAll() {
    const db = getContentDB();
    const scenarios = db.prepare("SELECT id, entity_id, level FROM scenarios WHERE approved = 0").all();
    console.log(`\n🧠 AI Verifier: ${scenarios.length} scenarios\n`);
    for (const s of scenarios) {
      const r = this.verify(s.id);
      console.log(`  ${r.pass ? "✅" : "⚠️"} ${s.entity_id} Lv.${s.level}: ${r.recommendation}`);
      r.issues.forEach(i => console.log(`     • ${i}`));
    }
    return this.results;
  }

  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.pass).length;
    const byEntity = {};
    for (const r of this.results) {
      if (!byEntity[r.entity]) byEntity[r.entity] = { total: 0, pass: 0 };
      byEntity[r.entity].total++;
      if (r.pass) byEntity[r.entity].pass++;
    }
    return { summary: { total, passed, failed: total - passed, passRate: total ? Math.round((passed / total) * 100) : 0 }, byEntity, timestamp: new Date().toISOString() };
  }
}

// ── PREDICTIVE ANALYTICS ──
export class PredictiveAnalytics {
  constructor() { this.anomalyThreshold = 0.85; this.churnRiskThreshold = -15; }

  detectAnomalyZones(battleLogs) {
    const byScenario = {};
    for (const log of battleLogs) {
      const key = `${log.scenario_id}_${log.entity_id}`;
      if (!byScenario[key]) byScenario[key] = { total: 0, losses: 0, entityId: log.entity_id, scenarioId: log.scenario_id };
      byScenario[key].total++;
      if (log.result === "loss") byScenario[key].losses++;
    }
    const anomalies = [];
    for (const [key, data] of Object.entries(byScenario)) {
      const failRate = data.losses / data.total;
      if (failRate > this.anomalyThreshold && data.total >= 10) {
        anomalies.push({ scenarioId: data.scenarioId, entityId: data.entityId, failRate: Math.round(failRate * 100), totalPlays: data.total,
          severity: failRate > 0.95 ? "CRITICAL" : failRate > 0.90 ? "HIGH" : "MEDIUM",
          recommendation: failRate > 0.95 ? "Срочная корректировка сложности" : "Рекомендовано снизить сложность" });
      }
    }
    return anomalies.sort((a, b) => b.failRate - a.failRate);
  }

  predictChurn(playersData) {
    return playersData.filter(p => (p.discipline_delta && p.discipline_delta < this.churnRiskThreshold) || p.daysSinceLastBattle > 7)
      .map(p => ({ playerId: p.id, displayName: p.display_name, risk: (p.discipline_delta || 0) < -25 ? "HIGH" : "MEDIUM",
        reason: p.discipline_delta < this.churnRiskThreshold ? "Discipline decline" : `${p.daysSinceLastBattle}d inactive`,
        recommendation: p.discipline_delta < this.churnRiskThreshold ? "Anti-tilt training in FOMO Arena" : "Daily puzzle reminder" }));
  }

  recommendCardDrops(errorFrequency, currentCardBalance) {
    const map = { "FOMO Entry": "Anti-FOMO Shield", "No Stop-Loss": "Stop-Loss Discipline", "Ignored Volume": "Volume Confirmation",
      "Overleverage": "Risk/Reward", "Revenge Trading": "Pre-trade Checklist", "Overconfidence": "Stop-Loss Discipline",
      "Fake Breakout Entry": "Breakout Confirmation" };
    return Object.entries(errorFrequency).sort(([,a], [,b]) => b - a).slice(0, 3)
      .filter(([err]) => map[err] && (!currentCardBalance[map[err]] || currentCardBalance[map[err]] < 3))
      .map(([err, count]) => ({ error: err, frequency: count, recommendedCard: map[err],
        action: `Повысить шанс "${map[err]}" в daily rewards на ${Math.min(25, count * 3)}%` }));
  }

  async runFullAnalysis(battleLogs, playersData, errorFreq, cardBalance) {
    const anomalies = this.detectAnomalyZones(battleLogs);
    const churnRisk = this.predictChurn(playersData);
    const cardRecs = this.recommendCardDrops(errorFreq, cardBalance);

    const lines = [];
    if (anomalies.length) { lines.push("⚠️ Аномальные зоны (fail rate > 85%):"); anomalies.forEach(a => lines.push(`  • ${a.entityId}: ${a.failRate}% fails (${a.totalPlays} игр) — ${a.recommendation}`)); }
    if (churnRisk.length) { lines.push("\n🔮 Риск оттока:"); churnRisk.slice(0, 5).forEach(p => lines.push(`  • ${p.displayName}: ${p.risk} — ${p.recommendation}`)); }
    if (cardRecs.length) { lines.push("\n🃏 Баланс карт:"); cardRecs.forEach(r => lines.push(`  • "${r.error}" (${r.frequency}×) → ${r.action}`)); }

    const header = "=".repeat(58);
    console.log(`\n${header}\n🧠 AI CO-PILOT — PREDICTIVE ANALYTICS REPORT\n${header}\n${lines.join("\n")}\n${header}\n`);
    return { anomalies, churnRisk, cardRecs, summary: lines.join("\n") };
  }
}

if (process.argv[1]?.includes("ai-copilot")) {
  const v = new ScenarioVerifier(); v.verifyAll();
  console.log("\n", JSON.stringify(v.generateReport(), null, 2));
}
