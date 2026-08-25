// ============================================================
// B2B TRADING EDUCATION API (block 4.3 — STUB)
// Mounted at /api/b2b. API-key access via ?api_key= header
// X-SigKey. Keys are in-memory (dev stub) — production moves
// them to a DB table + scopes. Endpoints per WHITEPAPER.md:
//   GET  /b2b/scenarios    — generate custom scenarios
//   GET  /b2b/assessment   — evaluate trader skills
//   GET  /b2b/curriculum   — structured learning paths
//   GET  /b2b/analytics    — skill progression analytics
//   POST /b2b/keys         — issue a partner key (admin/local)
// All responses carry stub: true — the data shape is final,
// the implementation is intentionally thin (real pipeline is
// the already-working admin generator + battle engine).
// ============================================================
import { getUser, getUsersDB, getContentDB } from "../db/index.js";
import { generateScenarios } from "../lib/scenario-gen.js";

// Dev in-memory partners (stub). Format: { key, org, tier, note, created }
const partners = new Map();

export async function b2bRoutes(app) {
  // ── API key middleware (stub: in-memory map) ──
  const keyGuard = async (req, reply) => {
    const key = req.headers["x-sigkey"] || req.query?.api_key || req.body?.api_key || "";
    const k = String(key).trim();
    if (!k) return reply.code(401).send({ error: "Missing API key (X-SigKey)" });
    const partner = partners.get(k);
    if (!partner) return reply.code(401).send({ error: "Invalid API key" });
    req.partner = partner;
    return; // continue
  };

  // POST /b2b/keys — issue a partner key (loopback/admin only)
  app.post("/keys", async (req, reply) => {
    const ip = req.ip || "";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    if (!isLocal) return reply.code(403).send({ error: "Loopback only (stub)" });
    const { org, tier, note } = req.body || {};
    let key = (req.body?.key || "").trim() || "SA-B2B-";
    if (!key.startsWith("SA-B2B-")) key = "SA-B2B-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    partners.set(key, { key, org: org || "unknown", tier: tier || "academy", note: note || "", created: new Date().toISOString() });
    return { key, partner: partners.get(key), note: "In-memory dev key — restart clears it." };
  });

  // GET /b2b/keys — list partners (loopback only)
  app.get("/keys", async (req, reply) => {
    const ip = req.ip || "";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    if (!isLocal) return reply.code(403).send({ error: "Loopback only (stub)" });
    return { partners: [...partners.values()] };
  });

  // GET /b2b/scenarios?entityId&level&count — generate custom scenarios (key-guarded)
  app.get("/scenarios", { preHandler: [keyGuard] }, async (req, reply) => {
    const entityId = String(req.query.entityId || "").trim();
    if (!entityId) return reply.code(400).send({ error: "entityId required" });
    const level = parseInt(req.query.level || "10");
    const count = parseInt(req.query.count || "5");
    const asset = req.query.asset || "ETH/USDT";
    if (req.query.persist === "1") {
      // generateScenarios ALREADY inserts the batch into content.db as DRAFT
      // (approved=0). The B2B sandbox just flips them to approved=1 — no
      // second insert (which would double-write and break column shape).
      const res = generateScenarios({ entityId, level, count, asset, generationType: "ai-synthetic" });
      if (res.error) return reply.code(404).send({ error: res.error });
      const db = getContentDB();
      const appr = db.prepare("UPDATE scenarios SET approved = 1 WHERE id = ?");
      db.transaction(() => { for (const s of res.scenarios) appr.run(s.id); })();
      return { stub: true, partner: req.partner.org, generated: res.generated, scenarioIds: res.scenarios.map((s) => s.id), nonce: res.nonce };
    }
    const rows = getContentDB().prepare(
      "SELECT id, entity_id, level, title, asset, briefing FROM scenarios WHERE entity_id = ? AND approved = 1 ORDER BY level LIMIT ?"
    ).all(entityId, Math.max(1, Math.min(20, count)));
    return { stub: true, partner: req.partner.org, asset, scenarios: rows.map((r) => ({
      id: r.id, entityId: r.entity_id, level: r.level, title: r.title, asset: r.asset, briefing: r.briefing,
    }))};
  });

  // GET /b2b/assessment?playerId — evaluate trader skills (key-guarded)
  app.get("/assessment", { preHandler: [keyGuard] }, async (req, reply) => {
    const playerId = String(req.query.playerId || "").trim();
    const player = getUser(playerId);
    if (!player) return reply.code(404).send({ error: "player not found" });
    const db = getUsersDB();
    const skills = db.prepare("SELECT skill_id, skill_name, value FROM player_skills WHERE player_id = ? AND value > 0 ORDER BY value DESC").all(playerId);
    const errors = db.prepare("SELECT error_id, error_title, count FROM player_errors WHERE player_id = ? ORDER BY count DESC LIMIT 5").all(playerId);
    const battles = db.prepare("SELECT result, score FROM battle_logs WHERE player_id = ? ORDER BY created_at DESC LIMIT 50").all(playerId);
    const wins = battles.filter((b) => b.result === "win").length;
    const score = battles.map((b) => b.score).reduce((a, b) => a + b, 0);
    return {
      stub: true, partner: req.partner.org,
      playerId, displayName: player.display_name,
      rankIndex: player.rank_index, xp: player.xp,
      battles: battles.length, wins, winRate: battles.length ? Math.round((wins / battles.length) * 100) : 0,
      avgScore: battles.length ? Math.round(score / battles.length) : 0,
      skills, topErrors: errors,
      // Heuristic grade for HR-style reporting (stub formula)
      grade: battles.length < 5 ? "insufficient-data"
        : (Math.round(score / battles.length) >= 80 && wins / battles.length >= 0.6) ? "A"
        : (Math.round(score / battles.length) >= 60) ? "B"
        : (Math.round(score / battles.length) >= 40) ? "C" : "D",
    };
  });

  // GET /b2b/curriculum?entityId — structured learning paths (key-guarded)
  app.get("/curriculum", { preHandler: [keyGuard] }, async (req) => {
    const db = getContentDB();
    const entities = db.prepare("SELECT id, name_ru, discipline, description FROM market_entities ORDER BY id").all();
    return {
      stub: true, partner: req.partner.org,
      path: entities.map((e, i) => ({
        stage: i + 1,
        entity: e.id,
        name: e.name_ru,
        discipline: e.discipline,
        lessons: [
          { id: `${e.id}_l1`, kind: "battle", title: `Покой ${e.name_ru} (уровни 5–9)` },
          { id: `${e.id}_l2`, kind: "battle", title: `Устойчивость: 3 победы подряд (уровни 12–18)` },
          { id: `${e.id}_l3`, kind: "review", title: `Аудит ошибок: журнал по дисциплине ${e.discipline}` },
        ],
        completion: "mastered", // client marks progression; stub returns the static shape
      })),
    };
  });

  // GET /b2b/analytics?playerId — skill progression analytics (key-guarded)
  app.get("/analytics", { preHandler: [keyGuard] }, async (req, reply) => {
    const playerId = String(req.query.playerId || "").trim();
    const player = getUser(playerId);
    if (!player) return reply.code(404).send({ error: "player not found" });
    const db = getUsersDB();
    const daily = db.prepare(`
      SELECT date(created_at) AS d,
             COUNT(*) AS battles,
             SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
             ROUND(AVG(score), 1) AS avg_score
      FROM battle_logs WHERE player_id = ? GROUP BY d ORDER BY d DESC LIMIT 14
    `).all(playerId);
    const skillTrend = db.prepare("SELECT skill_id, value FROM player_skills WHERE player_id = ? AND value > 0").all(playerId);
    return {
      stub: true, partner: req.partner.org, playerId,
      rating: player.rating, rankIndex: player.rank_index,
      streak: player.streak, longestStreak: player.longest_streak,
      daily: daily.reverse(), // chronological
      skillTrend,
    };
  });
}
