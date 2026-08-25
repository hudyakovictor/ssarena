import { simulationEngine } from "../simulation/simulation-engine.js";
import { ALL_SCENARIOS } from "../simulation/scenarios/all-scenarios.js";

export async function simulationRoutes(app) {
  // List all scenarios
  app.get("/api/sim/scenarios", async () => {
    return Object.entries(ALL_SCENARIOS).map(([key, s]) => ({
      key, name: s.name, description: s.description,
      duration: s.duration, events: s.events?.length || 0, acceleration: s.acceleration,
    }));
  });

  // Create simulation (predefined or custom)
  app.post("/api/sim/create", async (req) => {
    const { scenario, acceleration, customState, customEvents } = req.body || {};
    if (!scenario) return { error: "scenario required" };
    const sim = simulationEngine.createSimulation(scenario, {
      acceleration, customState, customEvents,
    });
    return sim;
  });

  // Quick run
  app.post("/api/sim/quick", async (req) => {
    const { scenario, acceleration, customState, customEvents } = req.body || {};
    const sim = simulationEngine.createSimulation(scenario || "healthy-growth", {
      acceleration, customState, customEvents,
    });
    if (sim.error) return sim;
    return await simulationEngine.runSimulation(sim.simId);
  });

  // Batch run — run multiple scenarios in parallel
  app.post("/api/sim/batch", async (req) => {
    const { scenarios } = req.body || {};
    if (!scenarios?.length) return { error: "scenarios array required" };
    const reports = [];
    for (const s of scenarios) {
      const sim = simulationEngine.createSimulation(s.scenario || s, { acceleration: s.acceleration, customState: s.customState, customEvents: s.customEvents });
      if (!sim.error) {
        const report = await simulationEngine.runSimulation(sim.simId);
        reports.push(report);
      }
    }
    return {
      total: reports.length,
      passed: reports.filter(r => r.verdict?.passed).length,
      failed: reports.filter(r => !r.verdict?.passed).length,
      reports,
    };
  });

  // Run simulation step-by-step (remote debug mode)
  app.post("/api/sim/step/:simId", async (req) => {
    const sim = simulationEngine.activeSimulations.get(req.params.simId);
    if (!sim) return { error: "not found" };
    const result = await simulationEngine.stepSimulation(req.params.simId);
    return result;
  });

  // Get active simulations
  app.get("/api/sim/active", async () => simulationEngine.getActive());

  // Get simulation history
  app.get("/api/sim/history", async (req) => {
    const limit = parseInt(req.query.limit || "20");
    return simulationEngine.getHistory(limit);
  });

  // Get simulation status
  app.get("/api/sim/status/:simId", async (req) => {
    const sim = simulationEngine.activeSimulations.get(req.params.simId);
    if (!sim) return { status: "not_found" };
    return { id: sim.id, scenario: sim.scenario, status: sim.status, day: sim.state?._simDay, duration: sim.duration };
  });

  // Get detailed simulation report
  app.get("/api/sim/report/:simId", async (req) => {
    const sim = simulationEngine.activeSimulations.get(req.params.simId) ||
                simulationEngine.completedSimulations.find(s => s.id === req.params.simId);
    if (!sim?.report) return { error: "Report not available" };
    return sim.report;
  });

  // ═══ EARLY WARNING API ═══
  app.post("/api/monitor/feed", async (req) => {
    const { metrics } = req.body || {};
    if (!metrics) return { error: "metrics object required" };
    const { trendDetector } = await import("../monitoring/early-warning.js");
    for (const [key, value] of Object.entries(metrics)) {
      trendDetector.feed(key, value);
    }
    return { fed: Object.keys(metrics).length };
  });

  app.get("/api/monitor/alerts", async () => {
    const { trendDetector } = await import("../monitoring/early-warning.js");
    return trendDetector.getAlerts();
  });

  app.get("/api/monitor/trends", async () => {
    const { trendDetector } = await import("../monitoring/early-warning.js");
    return trendDetector.getTrends();
  });

  app.get("/api/monitor/status", async () => {
    const { trendDetector } = await import("../monitoring/early-warning.js");
    return trendDetector.getStatus();
  });

  app.get("/api/monitor/thresholds", async () => {
    const { THRESHOLDS } = await import("../monitoring/early-warning.js");
    return THRESHOLDS;
  });

  console.log("  🧪 Simulation API: 16 scenarios + custom + batch + step + early-warning");
}
