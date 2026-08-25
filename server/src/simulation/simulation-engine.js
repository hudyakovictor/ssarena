// ============================================================
// SIGNAL ARENA — SIMULATION ENGINE
// Sandboxed parallel universe for agent testing
// Real agents don't know about simulation. Isolated data.
// Supports: snapshot-based, accelerated time, force majeure
// ============================================================

import { v4 as uuid } from "uuid";
import { RetentionIntelligence } from "../analytics/intelligence/retention.js";
import { ALL_SCENARIOS } from "./scenarios/all-scenarios.js";
import { EconomyIntelligence } from "../analytics/intelligence/economy.js";
import { LiveOpsIntelligence } from "../analytics/intelligence/liveops.js";

// ═══════════════════════════════════════════════
// SANDBOXED AGENT — Clone of real agent
// ═══════════════════════════════════════════════

class SandboxedAgent {
  constructor(id, name, IntelligenceClass) {
    this.id = id;
    this.name = name;
    this.intelligence = new IntelligenceClass();
    this.isSimulated = true;
    this.dataUniverse = {};  // isolated data — parallel to real metrics
    this.actionLog = [];
    this.alertsGenerated = [];
  }

  /** Feed synthetic data into agent's universe */
  feedData(data) {
    this.dataUniverse = { ...this.dataUniverse, ...data };
  }

  /** Run analysis on sandboxed data */
  analyze() {
    const result = this.intelligence.analyze(this.dataUniverse);
    this.actionLog.push({
      timestamp: this.dataUniverse._simTime || new Date().toISOString(),
      health: result.health,
      alertCount: result.alerts?.length || 0,
      topAction: result.top20Action?.desc || null,
      summary: result.summary,
    });
    this.alertsGenerated.push(...(result.alerts || []));
    return result;
  }
}

// ═══════════════════════════════════════════════
// SCENARIO DEFINITIONS
// ═══════════════════════════════════════════════


// ═══════════════════════════════════════════════
// SIMULATION ENGINE
// ═══════════════════════════════════════════════

class SimulationEngine {
  constructor() {
    this.activeSimulations = new Map();
    this.completedSimulations = [];
  }

  /**
   * Create a sandboxed simulation.
   * Real agents are NOT aware of the simulation.
   * Simulated agents have their own data universe.
   */
  createSimulation(scenarioKey, options = {}) {
    const { acceleration: optAccel, customState, customEvents } = options;
    const scenario = ALL_SCENARIOS[scenarioKey];
    if (!scenario) return { error: `Unknown scenario: ${scenarioKey}. Available: ${Object.keys(ALL_SCENARIOS).join(", ")}` };

    const simId = uuid().slice(0, 8);
    const acceleration = optAccel || scenario.acceleration;
    const initialState = { ...scenario.initialState, ...(customState || {}) };
    const events = customEvents || [...(scenario.events || [])];

    // Create sandboxed agent clones
    const agents = {
      retention: new SandboxedAgent("retention-sim", "Retention (SIM)", RetentionIntelligence),
      economy: new SandboxedAgent("economy-sim", "Economy (SIM)", EconomyIntelligence),
      liveops: new SandboxedAgent("liveops-sim", "LiveOps (SIM)", LiveOpsIntelligence),
    };

    // Initialize with scenario data
    const state = { ...initialState, _simTime: `Day 0`, _simDay: 0, _simId: simId };
    for (const agent of Object.values(agents)) {
      agent.feedData(state);
    }

    const simulation = {
      id: simId,
      scenario: scenarioKey,
      scenarioName: scenario.name,
      description: scenario.description,
      status: "initialized",
      agents,
      state: { ...state },
      events,
      duration: scenario.duration,
      acceleration,
      startTime: new Date().toISOString(),
      endTime: null,
      timeline: [],
      report: null,
    };

    this.activeSimulations.set(simId, simulation);
    return { simId, scenario: scenarioKey, name: scenario.name, duration: scenario.duration, acceleration };
  }

  /**
   * Run the simulation at accelerated speed.
   * Each "day" processes in `acceleration` ms.
   */
  async runSimulation(simId) {
    const sim = this.activeSimulations.get(simId);
    if (!sim) return { error: "Simulation not found" };

    sim.status = "running";
    const startTime = Date.now();

    // Process each day
    for (let day = 1; day <= sim.duration; day++) {
      sim.state._simDay = day;
      sim.state._simTime = `Day ${day}/${sim.duration}`;

      // Apply any events scheduled for this day
      const dayEvents = sim.events.filter(e => e.day === day);
      for (const event of dayEvents) {
        this._applyEvent(sim.state, event);
        sim.timeline.push({
          day, type: "event", event: event.event, effects: event.effect,
          state: { ...sim.state },
        });
      }

      // Feed updated data to all agents
      for (const agent of Object.values(sim.agents)) {
        agent.feedData(sim.state);
      }

      // Run analysis — agents react to current state
      for (const agent of Object.values(sim.agents)) {
        const result = agent.analyze();
        sim.timeline.push({
          day, type: "agent_reaction", agent: agent.name,
          health: result.health,
          alertCount: result.alerts?.length || 0,
          topAction: result.top20Action,
        });
      }

      // Wait for acceleration period
      if (day < sim.duration) {
        await new Promise(r => setTimeout(r, sim.acceleration));
      }
    }

    sim.status = "completed";
    sim.endTime = new Date().toISOString();
    sim.elapsedMs = Date.now() - startTime;

    // Generate report
    sim.report = this._generateReport(sim);
    this.completedSimulations.push(sim);
    this.activeSimulations.delete(simId);

    return sim.report;
  }

  /**
   * Apply event effects to simulation state.
   * Supports: "+50%", "-0.05", "=0.42" (absolute), "*1.5" (multiply)
   */
  _applyEvent(state, event) {
    for (const [key, rawValue] of Object.entries(event.effect)) {
      const current = state[key] || 0;
      if (typeof rawValue === "string") {
        if (rawValue.startsWith("+")) {
          const isPercent = rawValue.includes("%");
          const val = parseFloat(rawValue.replace("%", ""));
          state[key] = isPercent ? current * (1 + val / 100) : current + val;
        } else if (rawValue.startsWith("-")) {
          const isPercent = rawValue.includes("%");
          const val = parseFloat(rawValue.replace("%", ""));
          state[key] = isPercent ? current * (1 - Math.abs(val) / 100) : current - Math.abs(val);
        } else if (rawValue.startsWith("=")) {
          state[key] = parseFloat(rawValue.slice(1));
        } else if (rawValue.startsWith("*")) {
          state[key] = current * parseFloat(rawValue.slice(1));
        } else {
          state[key] = rawValue;
        }
      } else {
        state[key] = rawValue;
      }
    }
  }

  /**
   * Generate comprehensive simulation report
   */
  _generateReport(sim) {
    const agentSummaries = {};
    for (const [id, agent] of Object.entries(sim.agents)) {
      const criticalAlerts = agent.alertsGenerated.filter(a => a.severity === "CRITICAL");
      const highAlerts = agent.alertsGenerated.filter(a => a.severity === "HIGH");
      agentSummaries[id] = {
        name: agent.name,
        totalScans: agent.actionLog.length,
        totalAlerts: agent.alertsGenerated.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        topActions: [...new Set(agent.actionLog.map(a => a.topAction).filter(Boolean))],
        healthTrajectory: agent.actionLog.map(a => a.health),
        firstAlert: agent.alertsGenerated[0]?.metric || null,
        lastAlert: agent.alertsGenerated[agent.alertsGenerated.length - 1]?.metric || null,
      };
    }

    // Find key moments
    const criticalDays = sim.timeline.filter(t => t.type === "agent_reaction" && t.alertCount > 0);
    const eventDays = sim.timeline.filter(t => t.type === "event");

    return {
      simId: sim.id,
      scenario: sim.scenarioName,
      duration: sim.duration,
      acceleration: sim.acceleration,
      elapsedMs: sim.elapsedMs,
      realworldEquivalent: `${sim.duration} days simulated in ${(sim.elapsedMs / 1000).toFixed(1)}s real time`,
      initialState: sim.scenario?.initialState || sim.scenarios?.[sim.scenario],
      eventCount: sim.events.length,
      agents: agentSummaries,
      criticalMoments: criticalDays.map(d => `Day ${d.day}: ${d.agent} — health: ${d.health}, alerts: ${d.alertCount}`),
      eventTimeline: eventDays.map(d => `Day ${d.day}: ${d.event}`),
      verdict: this._generateVerdict(agentSummaries, sim),
    };
  }

  _generateVerdict(agents, sim) {
    const totalCritical = Object.values(agents).reduce((s, a) => s + a.criticalAlerts, 0);
    const warnings = [];
    if (totalCritical > 10) warnings.push(`Высокая концентрация критических алертов (${totalCritical})`);
    const healthEnd = Object.values(agents).map(a => a.healthTrajectory?.[a.healthTrajectory.length - 1] || "unknown");
    if (healthEnd.some(h => h === "critical")) warnings.push("Некоторые агенты завершили симуляцию в CRITICAL состоянии");
    if (warnings.length === 0) warnings.push("Все агенты успешно адаптировались к сценарию");

    return {
      totalCriticalAlerts: totalCritical,
      agentsFinalHealth: healthEnd,
      warnings,
      passed: totalCritical < 10 && !healthEnd.includes("critical"),
      recommendation: warnings.join(". "),
    };
  }

  /** Get available scenarios */
  getScenarios() {
    return Object.entries(ALL_SCENARIOS).map(([key, s]) => ({
      key, name: s.name, description: s.description, duration: s.duration, events: s.events.length,
    }));
  }

  /** Get active simulations */
  getActive() {
    return Array.from(this.activeSimulations.values()).map(s => ({
      id: s.id, scenario: s.scenario, status: s.status, day: s.state._simDay, duration: s.duration,
    }));
  }

  /** Step simulation one day at a time (for debugging) */
  async stepSimulation(simId) {
    const sim = this.activeSimulations.get(simId);
    if (!sim) return { error: "not found" };
    if (sim.status === "completed") return { status: "completed" };
    sim.status = "running";
    const day = sim.state._simDay + 1;
    sim.state._simDay = day;
    sim.state._simTime = `Day ${day}/${sim.duration}`;
    const dayEvents = sim.events.filter(e => e.day === day || e.day === Math.floor(day));
    for (const event of dayEvents) {
      this._applyEvent(sim.state, event);
      sim.timeline.push({ day, type: "event", event: event.event, state: { ...sim.state } });
    }
    for (const agent of Object.values(sim.agents)) { agent.feedData(sim.state); }
    for (const agent of Object.values(sim.agents)) {
      const r = agent.analyze();
      sim.timeline.push({ day, type: "agent_reaction", agent: agent.name, health: r.health, alertCount: r.alerts?.length || 0 });
    }
    if (day >= sim.duration) { sim.status = "completed"; sim.endTime = new Date().toISOString(); sim.report = this._generateReport(sim); this.completedSimulations.push(sim); this.activeSimulations.delete(simId); }
    return { day, duration: sim.duration, status: sim.status };
  }


  /** Get completed simulations history */
  getHistory(limit = 20) {
    return this.completedSimulations.slice(-limit).map(s => ({
      id: s.report?.simId, scenario: s.scenario, elapsedMs: s.elapsedMs,
      verdict: s.report?.verdict?.passed ? "PASSED" : "FAILED",
      criticals: s.report?.verdict?.totalCriticalAlerts,
    }));
  }
}

export const simulationEngine = new SimulationEngine();
export { ALL_SCENARIOS };
