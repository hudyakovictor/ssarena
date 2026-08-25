// ============================================================
// CONTENT ROUTES — Server-hosted game content (entities, candles)
// Serves the 18 market entities from the content DB and a
// deterministic per-scenario candle stream for the battle chart.
// ============================================================
import { v4 as uuid } from "uuid";
import { getContentDB } from "../db/index.js";
import { buildWeeklyBracket } from "../lib/content-pack.js";

// ── ENTITIES ──
export async function contentRoutes(app) {
  // GET /api/content/entities — all published market entities
  app.get("/entities", async () => {
    const rows = getContentDB().prepare(
      "SELECT * FROM market_entities WHERE published = 1 ORDER BY unlock_rank, corruption DESC"
    ).all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameRu: r.name_ru,
      archetype: r.archetype,
      discipline: r.discipline,
      threatLevel: r.threat_level,
      corruption: r.corruption,
      description: r.description,
      lore: r.lore_snippet || r.manifest_desc || r.description,
      unlockRank: r.unlock_rank || 0,
      glyph: glyphFor(r.archetype),
    }));
  });

  // GET /api/content/entities/:id — one entity
  app.get("/entities/:id", async (req, reply) => {
    const row = getContentDB()
      .prepare("SELECT * FROM market_entities WHERE id = ? AND published = 1")
      .get(req.params.id);
    if (!row) return reply.code(404).send({ error: "Entity not found" });
    return {
      id: row.id, name: row.name, nameRu: row.name_ru, archetype: row.archetype,
      discipline: row.discipline, threatLevel: row.threat_level, corruption: row.corruption,
      description: row.description, lore: row.lore_snippet || row.manifest_desc || row.description,
      unlockRank: row.unlock_rank || 0, glyph: glyphFor(row.archetype),
    };
  });
  // GET /api/content/tournament/weekly — public paper bracket (top-16 leaderboard)
  app.get("/tournament/weekly", async () => buildWeeklyBracket());
}

// ── Candles endpoint ──
const CANDLE_BASE = Math.floor(Date.UTC(2026, 6, 3, 0, 0, 0) / 1000);

function hashCode(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// GET /api/game/candles?seed=scenarioId&count=60&vol=1.0&trend=-1
export async function candlesRoutes(app) {
  app.get("/candles", async (req) => {
    const seed = String(req.query.seed || "default");
    const count = Math.max(10, Math.min(240, parseInt(req.query.count || "60")));
    const vol = Math.max(0.1, Math.min(5, parseFloat(req.query.vol || "1.0")));
    const trend = Math.max(-1, Math.min(1, parseFloat(req.query.trend || "-0.2")));

    const rng = mulberry32(hashCode(seed));
    const candles = [];
    let price = 3200 * (0.85 + rng() * 0.3);
    for (let i = 0; i < count; i++) {
      const drift = trend * price * 0.0009;
      const shock = (rng() - 0.5) * 2 * price * 0.006 * vol;
      const open = price;
      const close = Math.max(1, open + drift + shock);
      const high = Math.max(open, close) + rng() * price * 0.004 * vol;
      const low = Math.min(open, close) - rng() * price * 0.004 * vol;
      candles.push({
        time: CANDLE_BASE + i * 3600,
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
      });
      price = close;
    }
    return { seed, count, asset: "ETH/USDT", candles };
  });
}

function glyphFor(archetype) {
  const map = {
    wraith: "👻", phantom: "👤", mimick: "🪤", mimic: "🪤", hydra: "🐉",
    goblin: "👺", dragon: "🐲", titanic: "🏛️", titanic2: "🏛️", titan: "🏛️",
    siren: "🧜", cult: "🕯️", parasitic: "🦠", parasite: "🦠", syndicate: "🐋",
    mirage: "🌀", unknown: "❓",
  };
  return map[archetype] || "❓";
}
