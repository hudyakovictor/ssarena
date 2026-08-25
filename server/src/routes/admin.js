// ============================================================
// ADMIN ROUTES — Content, AI, Encryption, Staging Tunnel
// ============================================================
import { v4 as uuid } from "uuid";
import { CONFIG } from "../config/index.js";
import { getContentDB, insertScenario } from "../db/index.js";
import { broker } from "../lib/broker.js";
import { getActiveSessions } from "../lib/redis.js";
import { banIP, unbanIP, getBanList } from "../middleware/anti-recon.js";
import { ScenarioVerifier, PredictiveAnalytics } from "../analytics/ai-copilot.js";
import { encryptPackage, decryptPackage, signPackage } from "../content/encryption.js";
import { pushContentToStaging, pullContentFromStaging } from "../content/grpc-tunnel.js";
import { generateScenarios } from "../lib/scenario-gen.js";
import { buildContentPack, buildWeeklyBracket } from "../lib/content-pack.js";

export async function adminRoutes(app) {
  // Admin access — localhost only
  app.addHook("onRequest", async (req, reply) => {
    const ip = req.ip || "";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.");
    if (!isLocal && CONFIG.SERVER.NODE_ENV === "production") {
      return reply.code(403).send({ error: "Admin access denied" });
    }
  });

  // ── CONTENT PUSH ──
  app.post("/content/push", async (req, reply) => {
    const { scenarios = [], entities = [], cards = [], locales = {} } = req.body || {};
    const db = getContentDB();
    let pushed = 0;
    for (const s of scenarios) { insertScenario({ ...s, id: s.id || uuid() }); pushed++; }
    const insertEntity = db.prepare("INSERT OR REPLACE INTO market_entities (id, name, name_ru, archetype, discipline, threat_level, corruption, description, unlock_rank, axes_json, mistakes_json, counters_json, weak_skills_json, key_data_json, published) VALUES (?,?,?,?,?,?,?,?,?,?,'{}','[]','[]','[]','[]',1)");
    for (const e of entities) { insertEntity.run(e.id, e.name, e.name_ru, e.archetype, e.discipline, e.threat_level, e.corruption, e.description, e.unlock_rank); pushed++; }
    const insertCard = db.prepare("INSERT OR REPLACE INTO skill_cards (id, name_en, name_ru, tier, rarity, cost, discipline, category, effect, flavor, glyph, published) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)");
    for (const c of cards) { insertCard.run(c.id, c.nameEn, c.nameRu, c.tier, c.rarity, c.cost, c.discipline, c.category, c.effect, c.flavor, c.glyph); pushed++; }
    const insertLocale = db.prepare("INSERT OR REPLACE INTO locales (locale_key, lang, module, value) VALUES (?,?,?,?)");
    for (const [lang, modules] of Object.entries(locales)) { for (const [mod, keys] of Object.entries(modules)) { for (const [key, val] of Object.entries(keys)) { insertLocale.run(key, lang, mod, val); } } }
    db.prepare("INSERT INTO content_sync_log (id, sync_type, items_count) VALUES (?, 'push', ?)").run(uuid(), pushed);
    return { pushed, message: `${pushed} items synced` };
  });

  app.post("/content/compile-locales", async () => {
    const db = getContentDB();
    const rows = db.prepare("SELECT * FROM locales ORDER BY lang, module").all();
    const compiled = {}; for (const r of rows) { if (!compiled[r.lang]) compiled[r.lang] = {}; if (!compiled[r.lang][r.module]) compiled[r.lang][r.module] = {}; compiled[r.lang][r.module][r.locale_key] = r.value; }
    return { locales: compiled, modules: Object.keys(compiled.en || {}) };
  });

  // ── SCENARIO GENERATION (block 3.1) ──
  // POST /content/generate  { entityId, level, count, asset }
  app.post("/content/generate", async (req, reply) => {
    const { entityId, level, count, asset, generationType } = req.body || {};
    if (!entityId) return reply.code(400).send({ error: "entityId required" });
    const res = generateScenarios({ entityId, level, count, asset, generationType });
    if (res.error) return reply.code(404).send({ error: res.error });
    return { generated: res.generated, scenarios: res.scenarios.map((s) => ({ id: s.id, entityId: s.entityId, level: s.level, title: s.title, asset: s.asset, approved: s.approved })) };
  });

  // GET /content/scenarios — list all (admin), with approval state
  app.get("/content/scenarios", async () => {
    const db = getContentDB();
    const rows = db.prepare("SELECT id, entity_id, level, rank_req, asset, title, briefing, generation_type, approved, created_at FROM scenarios ORDER BY created_at DESC, level").all();
    return { scenarios: rows.map((r) => ({
      id: r.id, entityId: r.entity_id, level: r.level, rankReq: r.rank_req,
      asset: r.asset, title: r.title, briefing: r.briefing,
      generationType: r.generation_type, approved: r.approved === 1, createdAt: r.created_at,
    })) };
  });

  // POST /content/scenarios/approve  { id, approved }
  app.post("/content/scenarios/approve", async (req, reply) => {
    const { id, approved } = req.body || {};
    if (!id) return reply.code(400).send({ error: "id required" });
    const db = getContentDB();
    const ex = db.prepare("SELECT id FROM scenarios WHERE id = ?").get(id);
    if (!ex) return reply.code(404).send({ error: "Scenario not found" });
    db.prepare("UPDATE scenarios SET approved = ? WHERE id = ?").run(approved ? 1 : 0, id);
    return { id, approved: approved ? 1 : 0 };
  });

  // POST /content/scenarios/publish — approve + sign + increment version
  // This is the admin's "push to players" action: the scenario becomes part of
  // the signed content pack served to clients.
  app.post("/content/scenarios/publish", async (req, reply) => {
    const { id } = req.body || {};
    if (!id) return reply.code(400).send({ error: "id required" });
    const db = getContentDB();
    const ex = db.prepare("SELECT id FROM scenarios WHERE id = ?").get(id);
    if (!ex) return reply.code(404).send({ error: "Scenario not found" });
    db.prepare("UPDATE scenarios SET approved = 1 WHERE id = ?").run(id);
    const pack = buildContentPack({ bump: true });
    db.prepare("INSERT INTO content_sync_log (id, sync_type, items_count, status) VALUES (?, 'publish', ?, 'success')").run(id, pack.items.scenarios);
    return { published: id, packVersion: pack.version, signature: pack.signature, items: pack.items };
  });

  // DELETE /content/scenarios/:id
  app.delete("/content/scenarios/:id", async (req, reply) => {
    const db = getContentDB();
    db.prepare("DELETE FROM scenario_options WHERE scenario_id = ?").run(req.params.id);
    const info = db.prepare("DELETE FROM scenarios WHERE id = ?").run(req.params.id);
    if (info.changes === 0) return reply.code(404).send({ error: "Scenario not found" });
    return { deleted: req.params.id };
  });

  // ── SIGNED CONTENT PACK (block 3.1/3.2) ──
  // GET /content/pack — current signed snapshot for clients
  app.get("/content/pack", async () => {
    const { pack, signature, version, items } = buildContentPack();
    return { pack, signature, version, items };
  });

  // POST /content/pack/publish — bump version, return fresh signed pack
  app.post("/content/pack/publish", async () => {
    const { pack, signature, version, items } = buildContentPack({ bump: true });
    return { pack, signature, version, items, publishedAt: pack.pack.generatedAt };
  });

  // ── TOURNAMENT (block 3.4) ──
  // GET /tournament/weekly — live paper bracket from the top of the leaderboard
  app.get("/tournament/weekly", async () => buildWeeklyBracket());

  // ── AI CO-PILOT ──
  app.post("/ai/verify-scenario", async (req, reply) => {
    const { scenarioId } = req.body || {};
    if (!scenarioId) return reply.code(400).send({ error: "scenarioId required" });
    return new ScenarioVerifier().verify(scenarioId);
  });

  app.post("/ai/verify-all", async () => {
    const v = new ScenarioVerifier(); v.verifyAll();
    return v.generateReport();
  });

  app.post("/ai/analytics", async (req) => {
    const { battleLogs = [], playersData = [], errorFreq = {}, cardBalance = {} } = req.body || {};
    return await new PredictiveAnalytics().runFullAnalysis(battleLogs, playersData, errorFreq, cardBalance);
  });

  // ── CONTENT ENCRYPTION ──
  app.post("/content/encrypt", async (req) => {
    const enc = encryptPackage(req.body || {});
    return { encrypted: enc.encrypted.slice(0, 100) + "...", algorithm: enc.algorithm, encryptedAt: enc.encryptedAt };
  });

  app.post("/content/decrypt", async (req, reply) => {
    try { return { success: true, data: decryptPackage(req.body) }; }
    catch (e) { return reply.code(400).send({ error: "Decrypt failed", message: e.message }); }
  });

  // ── STAGING TUNNEL (§16.1, §16.5) ──
  app.post("/content/push-staging", async (req) => {
    return await pushContentToStaging(req.body || { content: {} });
  });

  app.post("/content/pull-staging", async () => {
    const c = await pullContentFromStaging();
    return c ? { pulled: true, entities: c.content?.entities?.length, scenarios: c.content?.scenarios?.length } : { pulled: false };
  });

  app.get("/content/staging-list", async () => {
    const { StagingBucket } = await import("../content/grpc-tunnel.js");
    return await new StagingBucket().list();
  });

  // ── BROKER ──
  app.get("/broker/status", async () => ({ brokerType: CONFIG.BROKER.TYPE, queueStatus: broker.status(), activeBattleSessions: await getActiveSessions() }));
  app.get("/analytics/pull", async (req) => {
    const events = broker.flush(req.query.topic || "sa.battle.events");
    return { topic: req.query.topic, count: events.length, events: events.slice(0, 100) };
  });

  // ── SECURITY ──
  app.get("/security/bans", async () => ({ bans: getBanList() }));
  app.post("/security/ban", async (req, reply) => { const { ip, durationMs } = req.body || {}; if (!ip) return reply.code(400); banIP(ip, durationMs); return { banned: ip }; });
  app.post("/security/unban", async (req, reply) => { const { ip } = req.body || {}; if (!ip) return reply.code(400); unbanIP(ip); return { unbanned: ip }; });

  app.get("/health", async () => ({
    server: { uptime: process.uptime(), memory: process.memoryUsage().heapUsed },
    db: { usersReady: true, contentReady: true },
    broker: { type: CONFIG.BROKER.TYPE, queueStatus: broker.status() },
    activeSessions: await getActiveSessions(),
  }));
}
