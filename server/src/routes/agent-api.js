// ============================================================
// AGENT API — HTTP endpoints for AI Agent System
// Chat, scan, safety controls, autonomous summaries
// ============================================================

import { orchestrator, safety, AGENTS } from "../agents/agent-system.js";

export async function agentRoutes(app) {
  // ── SAFETY CONTROLS ──
  app.post("/api/agents/halt", async (req) => {
    const { reason } = req.body || {};
    return safety.haltAll(reason || "manual");
  });

  app.post("/api/agents/resume", async () => {
    return safety.resumeAll();
  });

  app.post("/api/agents/toggle", async (req) => {
    const { agentId, enabled } = req.body || {};
    if (!agentId) return { error: "agentId required" };
    return safety.toggleAgent(agentId, enabled !== false);
  });

  app.get("/api/agents/safety", async () => {
    return safety.getStatus();
  });

  app.post("/api/agents/backup", async () => {
    return safety.startBackup();
  });

  // ── FULL SCAN ──
  app.post("/api/agents/scan", async (req) => {
    const results = await orchestrator.scanAll(req.body || {});
    return results;
  });

  // ── AUTONOMOUS SUMMARY ──
  app.get("/api/agents/summary", async () => {
    return orchestrator.getAutonomousSummary();
  });

  // ── CHAT ──
  app.post("/api/agents/chat", async (req) => {
    const { message } = req.body || {};
    if (!message) return { error: "Message required" };
    return orchestrator.chat(message);
  });

  app.get("/api/agents/chat/history", async (req) => {
    const limit = parseInt(req.query.limit || "50");
    return orchestrator.getChatHistory(limit);
  });

  app.post("/api/agents/chat/clear", async () => {
    return orchestrator.clearChat();
  });

  // ── INDIVIDUAL AGENT ENDPOINTS ──
  for (const [id, agent] of Object.entries(AGENTS)) {
    app.post(`/api/agents/${id}/scan`, async (req) => {
      return await agent.scan(req.body || {});
    });

    app.get(`/api/agents/${id}/report`, async () => {
      return agent.fullReport();
    });

    app.get(`/api/agents/${id}/quick`, async () => {
      return { agent: agent.name, report: agent.quickReport() };
    });
  }

  console.log("  🤖 Agent API routes registered (6 agents)");
}
