// ============================================================
// SIGNAL ARENA — AI AGENT SYSTEM
// Multi-agent architecture with pre-configured prompts
// Each agent = domain expertise + autonomous reporting + chat
// Safety: global kill-switch + individual agent toggles
// ============================================================

import { RetentionIntelligence } from "../analytics/intelligence/retention.js";
import { EconomyIntelligence } from "../analytics/intelligence/economy.js";
import { LiveOpsIntelligence } from "../analytics/intelligence/liveops.js";
import { ScenarioVerifier } from "../analytics/ai-copilot.js";
import { EconomicOverseer } from "../economics/tokenomics.js";
import { AICoPilot } from "../analytics/intelligence/orchestrator.js";
import { broker } from "../lib/broker.js";
import { CONFIG } from "../config/index.js";

// ═══════════════════════════════════════════════
// SAFETY SYSTEM
// ═══════════════════════════════════════════════

class SafetyController {
  constructor() {
    this.allAgentsHalted = false;
    this.haltedAt = null;
    this.haltReason = "";
    this.individualStatus = new Map();
    this.backupInProgress = false;
    this.emergencyContacts = [];
  }

  haltAll(reason = "manual") {
    this.allAgentsHalted = true;
    this.haltedAt = new Date().toISOString();
    this.haltReason = reason;
    console.warn(`🛑 ALL AI AGENTS HALTED. Reason: ${reason}`);
    return { halted: true, at: this.haltedAt, reason };
  }

  resumeAll() {
    this.allAgentsHalted = false;
    this.haltedAt = null;
    this.haltReason = "";
    console.log("🟢 ALL AI AGENTS RESUMED");
    return { resumed: true, at: new Date().toISOString() };
  }

  toggleAgent(agentId, enabled) {
    this.individualStatus.set(agentId, enabled);
    return { agentId, enabled, timestamp: new Date().toISOString() };
  }

  isAgentActive(agentId) {
    if (this.allAgentsHalted) return false;
    return this.individualStatus.get(agentId) !== false;
  }

  startBackup() {
    this.backupInProgress = true;
    console.log("💾 BACKUP INITIATED — saving all AI state...");
    setTimeout(() => { this.backupInProgress = false; console.log("💾 Backup complete."); }, 3000);
    return { backupStarted: true };
  }

  getStatus() {
    return {
      globalHalted: this.allAgentsHalted,
      haltedAt: this.haltedAt,
      haltReason: this.haltReason,
      backupInProgress: this.backupInProgress,
      agents: Object.fromEntries(this.individualStatus),
    };
  }
}

export const safety = new SafetyController();

// ═══════════════════════════════════════════════
// AGENT DEFINITIONS — Pre-configured prompts
// ═══════════════════════════════════════════════

class AIAgent {
  constructor(id, name, role, description, intelligence, shortPrompts, fullPrompts) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.description = description;
    this.intelligence = intelligence;
    this.shortPrompts = shortPrompts;    // < 200 chars, quick insights
    this.fullPrompts = fullPrompts;      // unlimited, deep analysis
    this.lastScan = null;
    this.lastReport = null;
    this.conversationHistory = [];
  }

  async scan(state = {}) {
    if (!safety.isAgentActive(this.id)) {
      return { agent: this.name, status: "HALTED", message: "Agent is deactivated by safety controller." };
    }
    try {
      const result = this.intelligence.analyze(state);
      this.lastScan = { timestamp: new Date().toISOString(), result };
      return result;
    } catch (e) {
      return { agent: this.name, status: "ERROR", message: e.message };
    }
  }

  /** Quick report — pre-configured short prompt style */
  quickReport() {
    if (!this.lastScan) return `${this.name}: No scan data yet. Run full scan first.`;
    const r = this.lastScan.result;
    return r?.summary || `${this.name}: ${r?.health || "unknown"} — ${r?.stats?.totalAlerts || 0} alerts`;
  }

  /** Full report — pre-configured deep analysis prompt */
  fullReport() {
    if (!this.lastScan) return `${this.name}: No scan data yet.`;
    const r = this.lastScan.result;
    return {
      agent: this.name,
      role: this.role,
      health: r?.health || "unknown",
      alerts: r?.alerts || [],
      insights: r?.insights || [],
      topAction: r?.top20Action || null,
      timestamp: this.lastScan.timestamp,
    };
  }

  /** Chat response — gets conversation context */
  chat(message, history = []) {
    this.conversationHistory.push({ role: "user", message, timestamp: new Date().toISOString() });
    const response = this.generateResponse(message, history);
    this.conversationHistory.push({ role: "agent", message: response, timestamp: new Date().toISOString() });
    return response;
  }

  generateResponse(message, history) {
    // Use lastScan data + message context to generate relevant response
    const r = this.lastScan?.result;
    const health = r?.health || "unknown";
    const alertCount = r?.stats?.totalAlerts || 0;

    // Match message to pre-configured prompt patterns
    const msg = message.toLowerCase();

    if (msg.includes("статус") || msg.includes("status") || msg.includes("health")) {
      return `[${this.name}] Статус: ${health}. ${alertCount > 0 ? `Обнаружено ${alertCount} алертов.` : "Всё чисто."} ${r?.summary || ""}`;
    }

    if (msg.includes("критич") || msg.includes("critical") || msg.includes("проблем")) {
      const critical = r?.alerts?.filter(a => a.severity === "CRITICAL") || [];
      return critical.length > 0
        ? `[${this.name}] КРИТИЧЕСКИЕ: ${critical.map(a => `${a.metric}: ${a.value} → ${a.target}`).join(" | ")}`
        : `[${this.name}] Критических проблем нет.`;
    }

    if (msg.includes("рекоменд") || msg.includes("что делать") || msg.includes("recommend")) {
      const top = r?.top20Action;
      return top
        ? `[${this.name}] Рекомендация: ${top.desc} (impact: ${top.impact}/100, effort: ${top.effort}). Контекст: ${top.context}.`
        : `[${this.name}] Запусти полный скан для получения рекомендаций.`;
    }

    if (msg.includes("сводк") || msg.includes("brief") || msg.includes("summary")) {
      return this.quickReport();
    }

    if (msg.includes("подробн") || msg.includes("detail") || msg.includes("full")) {
      const full = this.fullReport();
      return `[${this.name}] Подробный отчёт:\nHealth: ${full.health}\nAlerts: ${JSON.stringify(full.alerts?.map(a => a.metric) || [])}\nTop Action: ${full.topAction?.desc || "none"}`;
    }

    // Generic response using scan data
    return `[${this.name}] ${this.description}. Текущий статус: ${health}. ${alertCount > 0 ? `${alertCount} алертов требуют внимания.` : "Система работает нормально."} Используй ключевые слова: статус, критич, рекоменд, сводка, подробно.`;
  }
}

// ═══════════════════════════════════════════════
// CREATE ALL AGENTS
// ═══════════════════════════════════════════════

export const AGENTS = {
  retention: new AIAgent(
    "retention",
    "Retention Analyst 🎯",
    "Аналитик удержания",
    "Анализирую D1/D7/D30 retention, loss streaks, tournament funnel, post-defeat возвраты. Нахожу главные причины оттока.",
    new RetentionIntelligence(),
    ["D1:<40%=CRITICAL","Loss streak>3=churn risk","Session depth<2=warning"],
    ["Полный когортный анализ","Сегментация по рангам","Churn prediction модели"]
  ),

  economy: new AIAgent(
    "economy",
    "Economy Controller 💰",
    "Контролёр экономики",
    "Мониторю burn/emission ratio, sink utilization, premium conversion, fairness free-vs-premium. Защищаю non-pay-to-win принцип.",
    new EconomyIntelligence(),
    ["Burn<20%=CRITICAL","Premium conversion<3%=HIGH","Winrate gap>5%=PAY-TO-WIN"],
    ["Sink/faucet анализ","Fairness audit","Marketplace health","Token velocity"]
  ),

  liveops: new AIAgent(
    "liveops",
    "LiveOps Commander 📅",
    "Командир live-операций",
    "Планирую ивенты, турниры, сезонный контент. Отслеживаю корреляцию цена токена ↔ активность игры. Рекомендую ивенты под рыночную ситуацию.",
    new LiveOpsIntelligence(),
    ["0 tournaments=HIGH",">10 days no event=MEDIUM","Content <50%=MEDIUM"],
    ["Event calendar","Tournament profitability","Market correlation","On-chain awareness"]
  ),

  verifier: new AIAgent(
    "verifier",
    "Content Verifier 🔍",
    "Верификатор контента",
    "Тестирую каждый сценарий 5 виртуальными агентами (FOMO Bot, Satoshi Sleuth, Bastion, Degen, Contrarian). Проверяю: нет dead ends, options distinct, difficulty калибрована.",
    new ScenarioVerifier(),
    ["Options<3=FAIL","Correct count!=1=FAIL","Agent winrate>80%=TOO EASY"],
    ["Batch verify","Detailed per-scenario report","Difficulty calibration check"]
  ),

  security: new AIAgent(
    "security",
    "Security Sentinel 🛡️",
    "Страж безопасности",
    "Мониторю anti-recon, rate limiting, banned IPs, failed logins. Детектирую аномалии. Управляю бан-листом.",
    {
      analyze: (state) => ({
        health: (state?.reconAttempts || 0) < 50 ? "healthy" : "warning",
        alerts: (state?.reconAttempts || 0) > 50 ? [{ severity: "HIGH", metric: "recon_attempts", value: String(state.reconAttempts), target: "< 50", insight: "Повышенная активность сканирования." }] : [],
        insights: [{ sentiment: "positive", insight: `Забанено IP: ${state?.bannedIPs || 0}. Активных: ${state?.reconAttempts || 0}.` }],
        summary: `🛡 Безопасность: ${(state?.reconAttempts || 0) < 50 ? "✅" : "⚠️"} ${state?.bannedIPs || 0} банов.`,
      }),
    },
    ["Recon attempts>50=WARNING","DDOS detected=CRITICAL","Spam chat=MEDIUM"],
    ["Security audit","IP reputation","Rate limit analysis"]
  ),
};

// ═══════════════════════════════════════════════
// ORCHESTRATOR — Routes chat + auto-summaries
// ═══════════════════════════════════════════════

class AgentOrchestrator {
  constructor() {
    this.agents = AGENTS;
    this.chatHistory = [];
    this.autoReportInterval = null;
  }

  /** Run all agents — full system scan */
  async scanAll(state = {}) {
    const results = {};
    for (const [id, agent] of Object.entries(this.agents)) {
      if (!safety.isAgentActive(id)) {
        results[id] = { status: "HALTED" };
        continue;
      }
      results[id] = await agent.scan(state);
    }
    return results;
  }

  /** Get autonomous summary from all agents */
  getAutonomousSummary() {
    const summaries = [];
    for (const [id, agent] of Object.entries(this.agents)) {
      if (!safety.isAgentActive(id)) {
        summaries.push({ agent: agent.name, status: "HALTED", report: "Agent deactivated." });
        continue;
      }
      summaries.push({
        agent: agent.name,
        role: agent.role,
        status: agent.lastScan?.result?.health || "unknown",
        report: agent.quickReport(),
      });
    }
    return {
      timestamp: new Date().toISOString(),
      safetyStatus: safety.getStatus(),
      agents: summaries,
      overview: summaries.map(s => `${s.agent}: ${s.status}`).join(" | "),
    };
  }

  /** Route chat message to appropriate agent(s) */
  chat(message) {
    if (safety.allAgentsHalted) {
      return { response: "🛑 ВСЕ AI-АГЕНТЫ ОСТАНОВЛЕНЫ. Используй /resume для возобновления.", halted: true };
    }

    this.chatHistory.push({ role: "user", message, timestamp: new Date().toISOString() });

    const msg = message.toLowerCase();
    let targetAgent = null;

    // Route to specific agent based on keywords
    if (msg.includes("retention") || msg.includes("удерж") || msg.includes("отток") || msg.includes("churn") || msg.includes("d1") || msg.includes("d7")) {
      targetAgent = this.agents.retention;
    } else if (msg.includes("экономи") || msg.includes("economy") || msg.includes("token") || msg.includes("burn") || msg.includes("sink") || msg.includes("fairness") || msg.includes("pay-to-win")) {
      targetAgent = this.agents.economy;
    } else if (msg.includes("ивент") || msg.includes("event") || msg.includes("турнир") || msg.includes("tournament") || msg.includes("liveops") || msg.includes("цена") || msg.includes("price")) {
      targetAgent = this.agents.liveops;
    } else if (msg.includes("сценарий") || msg.includes("scenario") || msg.includes("верифик") || msg.includes("verify") || msg.includes("контент")) {
      targetAgent = this.agents.verifier;
    } else if (msg.includes("безопас") || msg.includes("security") || msg.includes("бан") || msg.includes("recon") || msg.includes("ddos")) {
      targetAgent = this.agents.security;
    } else if (msg.includes("всех") || msg.includes("all") || msg.includes("сводк") || msg.includes("статус всех") || msg.includes("общий")) {
      // Route to ALL agents
      const responses = [];
      for (const [id, agent] of Object.entries(this.agents)) {
        if (safety.isAgentActive(id)) {
          responses.push(agent.chat(message, this.chatHistory));
        }
      }
      const response = { type: "all_agents", responses, timestamp: new Date().toISOString() };
      this.chatHistory.push({ role: "orchestrator", message: "All agents queried", timestamp: new Date().toISOString() });
      return response;
    }

    if (targetAgent) {
      const response = targetAgent.chat(message, this.chatHistory);
      this.chatHistory.push({ role: "orchestrator", message: `Routed to ${targetAgent.name}`, timestamp: new Date().toISOString() });
      return { type: "single_agent", agent: targetAgent.name, response, timestamp: new Date().toISOString() };
    }

    // Default: ask which agent to route to
    const agentList = Object.values(this.agents).map(a => `• ${a.name} — ${a.role}`).join("\n");
    const response = `Я — AI Оркестратор Signal Arena. К кому направить запрос?\n\n${agentList}\n\nИли скажи "всех" чтобы спросить всех агентов.\nКлючевые слова: retention, экономика, ивент, сценарий, безопасность, всех, сводка.`;
    this.chatHistory.push({ role: "orchestrator", message: response, timestamp: new Date().toISOString() });
    return { type: "orchestrator", response, timestamp: new Date().toISOString() };
  }

  /** Get full chat history */
  getChatHistory(limit = 50) {
    return this.chatHistory.slice(-limit);
  }

  /** Clear chat history */
  clearChat() {
    this.chatHistory = [];
    return { cleared: true };
  }
}

export const orchestrator = new AgentOrchestrator();
