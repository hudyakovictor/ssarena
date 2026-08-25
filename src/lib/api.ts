const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: "Network error" })); throw new Error(err.error || `HTTP ${res.status}`); }
  return res.json();
}

export const api = {
  guestLogin: (refCode?: string) => request<any>("/auth/guest" + (refCode ? "?ref=" + encodeURIComponent(refCode) : ""), { method: "POST" }),
  getDailyScenario: (pid?: string) => request<any>("/game/daily?playerId=" + (pid || "demo")),
  startPreBattle: (pid: string, sid: string, mode = "daily") => request<any>("/game/prebattle", { method: "POST", body: JSON.stringify({ playerId: pid, scenarioId: sid, mode }) }),
  submitDecision: (sid: string, oid: string) => request<any>("/game/battle/decide", { method: "POST", body: JSON.stringify({ sessionId: sid, optionId: oid }) }),
  triggerTwist: (sid: string) => request<any>("/game/battle/twist", { method: "POST", body: JSON.stringify({ sessionId: sid }) }),
  getPlayer: (pid: string) => request<any>("/player/" + pid),
  getErrors: (pid: string) => request<any[]>("/player/" + pid + "/errors"),
  getBattles: (pid: string, limit = 20) => request<any[]>("/player/" + pid + "/battles?limit=" + limit),
  getEntities: (pid: string) => request<any[]>("/player/" + pid + "/entities"),
  getShareCard: (pid: string) => request<any>("/player/" + pid + "/share-card"),
  getLeaderboard: (limit = 50) => request<any[]>("/leaderboard/global?limit=" + limit),
  getRankPosition: (pid: string) => request<any>("/leaderboard/position/" + pid),
  getContentEntities: () => request<any[]>("/content/entities"),
  getContentEntity: (id: string) => request<any>("/content/entities/" + id),
  getServerCandles: (seed: string, count = 60) => request<any>(`/game/candles?seed=${encodeURIComponent(seed)}&count=${count}&trend=-0.2`),
  runAIScan: (state?: any) => request<any>("/ai/scan", { method: "POST", body: JSON.stringify(state || {}) }),
  getAIHealth: () => request<any>("/ai/health"),
  healthCheck: () => request<any>("/health"),
  haltAgents: (reason?: string) => request<any>("/agents/halt", { method: "POST", body: JSON.stringify({ reason }) }),
  resumeAgents: () => request<any>("/agents/resume", { method: "POST" }),
  getSafetyStatus: () => request<any>("/agents/safety"),
  startBackup: () => request<any>("/agents/backup", { method: "POST" }),
  getAgentsSummary: () => request<any>("/agents/summary"),
  chatWithAgents: (message: string) => request<any>("/agents/chat", { method: "POST", body: JSON.stringify({ message }) }),
  // ── Block 3: content pipeline (admin) ──
  generateScenarios: (entityId: string, level: number, count: number) =>
    request<any>("/admin/content/generate", { method: "POST", body: JSON.stringify({ entityId, level, count }) }),
  listScenarios: () => request<any>("/admin/content/scenarios"),
  publishScenario: (id: string) => request<any>("/admin/content/scenarios/publish", { method: "POST", body: JSON.stringify({ id }) }),
  deleteScenario: (id: string) => request<any>(`/admin/content/scenarios/${id}`, { method: "DELETE" }),
  verifyScenario: (scenarioId: string) => request<any>("/admin/ai/verify-scenario", { method: "POST", body: JSON.stringify({ scenarioId }) }),
  getContentPack: () => request<any>("/content/pack"),
  getTournamentWeekly: () => request<any>("/content/tournament/weekly"),
  getOverseerDashboard: () => request<any>("/overseer/dashboard"),
  // ── Block 4: referral + wallet-demo + B2B ──
  getReferralStatus: (pid: string) => request<any>("/referral/status?playerId=" + pid),
  activateReferral: (pid: string, code: string) => request<any>("/referral/activate", { method: "POST", body: JSON.stringify({ playerId: pid, code }) }),
  walletDemo: (pid: string, name?: string) => request<any>("/auth/wallet-demo", { method: "POST", body: JSON.stringify({ playerId: pid, name }) }),
  walletDemoDisconnect: (pid: string) => request<any>("/auth/wallet-demo/disconnect", { method: "POST", body: JSON.stringify({ playerId: pid }) }),
  b2b: {
    createKey: (org: string, tier: string, note?: string) => request<any>("/b2b/keys", { method: "POST", body: JSON.stringify({ org, tier, note }) }),
    listKeys: () => request<any>("/b2b/keys"),
    scenarios: (entityId: string, extra?: Record<string, any>, key?: string) => request<any>("/b2b/scenarios?entityId=" + entityId + "&" + new URLSearchParams(extra || {}) + (key ? "&api_key=" + key : "")),
    assessment: (pid: string, key?: string) => request<any>("/b2b/assessment?playerId=" + pid + (key ? "&api_key=" + key : "")),
    curriculum: (key?: string) => request<any>("/b2b/curriculum" + (key ? "?api_key=" + key : "")),
    analytics: (pid: string, key?: string) => request<any>("/b2b/analytics?playerId=" + pid + (key ? "&api_key=" + key : "")),
  },
};
