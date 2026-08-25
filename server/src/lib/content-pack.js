// ============================================================
// CONTENT PACK (block 3.1/3.2) — build, sign, distribute
// A signed snapshot of all published content: entities, cards
// and approved scenarios. The signature (HMAC-SHA256) lets the
// client verify integrity before applying the pack — a tampered
// pack must be rejected, not silently applied.
// ============================================================
import { getContentDB, getUsersDB } from "../db/index.js";
import { signPackage } from "../content/encryption.js";

let packVersion = 0;

/**
 * Build a signed content pack from the content DB.
 * @param {object} [opts]
 * @param {boolean} [opts.bump] — bump the stored version counter (on publish)
 * @returns {{ pack: object, signature: string, version: number, items: {entities:number, cards:number, scenarios:number} }}
 */
export function buildContentPack({ bump = false } = {}) {
  const db = getContentDB();

  const entities = db.prepare(
    "SELECT id, name, name_ru, archetype, discipline, threat_level, corruption, description, lore_snippet, unlock_rank, axes_json, mistakes_json, counters_json, weak_skills_json, key_data_json FROM market_entities WHERE published = 1"
  ).all().map((e) => ({
    id: e.id, name: e.name, nameRu: e.name_ru, archetype: e.archetype,
    discipline: e.discipline, threatLevel: e.threat_level, corruption: e.corruption,
    description: e.description, lore: e.lore_snippet || "", unlockRank: e.unlock_rank || 0,
    axes: safeJson(e.axes_json), mistakes: safeJson(e.mistakes_json),
    counters: safeJson(e.counters_json), weakSkills: safeJson(e.weak_skills_json),
    keyData: safeJson(e.key_data_json),
  }));

  const cards = db.prepare(
    "SELECT id, name_en, name_ru, tier, rarity, cost, discipline, category, effect, flavor, glyph FROM skill_cards WHERE published = 1"
  ).all().map((c) => ({
    id: c.id, nameEn: c.name_en, nameRu: c.name_ru, tier: c.tier, rarity: c.rarity,
    cost: c.cost, discipline: c.discipline, category: c.category, effect: c.effect,
    flavor: c.flavor, glyph: c.glyph,
  }));

  const scenarios = db.prepare(
    "SELECT id, entity_id, level, rank_req, asset, briefing, title, difficulty_axes, time_limit, rounds, data_sources, created_by, generation_type, created_at FROM scenarios WHERE approved = 1 ORDER BY entity_id, level"
  ).all().map((s) => {
    const options = db.prepare(
      "SELECT id, opt_index, label, correct, layer1, layer2, layer3, errors_triggered, skill_deltas FROM scenario_options WHERE scenario_id = ? ORDER BY opt_index"
    ).all(s.id).map((o) => ({
      id: o.id, optIndex: o.opt_index, label: o.label, correct: o.correct === 1,
      layer1: o.layer1, layer2: o.layer2, layer3: o.layer3,
      errors: safeJson(o.errors_triggered), skillDeltas: safeJson(o.skill_deltas),
    }));
    return {
      id: s.id, entityId: s.entity_id, level: s.level, rankReq: s.rank_req || 0,
      asset: s.asset, briefing: s.briefing, title: s.title,
      difficultyAxes: safeJson(s.difficulty_axes), timeLimit: s.time_limit,
      rounds: s.rounds, dataSources: safeJson(s.data_sources),
      createdBy: s.created_by, generationType: s.generation_type,
      createdAt: s.created_at, options,
    };
  });

  const content = {
    kind: "signal-arena-content-pack",
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    entities, cards, scenarios,
  };

  return {
    pack: content,
    signature: signPackage(content),
    version: bump ? ++packVersion : packVersion,
    items: { entities: entities.length, cards: cards.length, scenarios: scenarios.length },
  };
}

function safeJson(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback ?? []; }
}

// ============================================================
// TOURNAMENT (block 3.4) — weekly cup from the live leaderboard
// Top-16 players (most wins, then rating) enter a single-
// elimination bracket with standard mirror seeding (1v16...).
// Round 1 is "completed" (scores = current rating), the rest
// carry as pending — this is a visualization of the standings,
// updated on every refresh.
// ============================================================
const AVATARS = ["🦅", "🧊", "🧠", "⚡", "💎", "🌊", "🔮", "🎯", "👑", "🜲", "🌀", "🛡️", "🔥", "❄️", "🪙", "🕶️"];

export function buildWeeklyBracket() {
  const rows = getUsersDB().prepare(
    "SELECT id, display_name, rating, rank_index, total_wins, streak FROM players ORDER BY total_wins DESC, rating DESC LIMIT 16"
  ).all();

  const names = rows.map((r, i) => ({
    name: r.display_name || `Player ${i + 1}`,
    score: r.rating,
    avatar: AVATARS[i % AVATARS.length],
    wins: r.total_wins,
  }));

  // Fill to 16 with ghosts so the bracket is always full
  while (names.length < 16) {
    names.push({ name: `Ghost ${names.length + 1}`, score: 1000 - names.length * 3, avatar: "👻", wins: 0 });
  }

  // Mirror seeding: strongest vs weakest
  const matches = [];
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `r4m${i}`,
      round: 4,
      slot: i,
      player1: names[i],
      player2: names[15 - i],
      winner: "p1", // highest rating wins on the paper board
      status: "completed",
    });
  }

  // Later rounds — pending, filled by winners
  for (let r = 3; r >= 1; r--) {
    const count = 1 << (r - 1);
    for (let slot = 0; slot < count; slot++) {
      matches.push({
        id: `r${r}m${slot}`,
        round: r,
        slot,
        player1: { name: "???", score: null, avatar: "❓" },
        player2: { name: "???", score: null, avatar: "❓" },
        winner: null,
        status: r === 1 ? "pending" : "pending",
      });
    }
  }
  // Finals marked as the "live" target round
  const final = matches.find((m) => m.id === "r1m0");
  if (final) final.status = "live";

  return {
    id: `weekly-cup-${new Date().toISOString().slice(0, 10)}`,
    name: "Weekly Signal Cup",
    tag: "Open",
    level: "Top-16",
    players: rows.length || 16,
    maxPlayers: 16,
    prizePool: "1,000 $SIG (demo)",
    timeLeft: "resets Monday 00:00",
    rounds: 4,
    currentRound: 1,
    seeded: rows.length,
    matches,
    note: "Paper bracket: standings snapshot. Real-time PvP cups arrive with the live queue.",
  };
}
